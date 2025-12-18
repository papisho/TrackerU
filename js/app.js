
// TrackerU - Main Application Logic

// Supabase configuration
const SUPABASE_URL = 'https://axrqkbdgcvsyoxlbuwoh.supabase.co';   // <- paste from Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnFrYmRnY3ZzeW94bGJ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTU4MTcsImV4cCI6MjA4MTA3MTgxN30.kTP1WkLi9dkU5VB6egAF6IehYVURVV2inIju_2ckTHQ';        // <- paste anon key

const SUPABASE_API = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};


// Data Management System
const DataManager = {
  _players: [],
  _initialized: false,

  async init() {
    if (this._initialized) return;
    try {
      const res = await fetch(`${SUPABASE_API}/players?select=*`, {
        headers: SUPABASE_HEADERS
      });

      // If anon is blocked by RLS, this can fail. That's OK.
      if (!res.ok) {
        // Keep quiet-ish; player access uses RPC now.
        console.warn('Players list fetch blocked or failed (this is expected for anon with RLS).');
        this._players = [];
      } else {
        this._players = await res.json();
      }

      this._initialized = true;
    } catch (err) {
      console.warn('Players list fetch error (expected for anon with RLS).', err);
      this._players = [];
      this._initialized = true;
    }
  },

  // Local cache helpers
  getPlayers() {
    return this._players;
  },

  getPlayerById(id) {
    return this._players.find(p => String(p.id) === String(id)) || null;
  },

  /**
   * Player lookup by secret code.
   * IMPORTANT: Uses RPC so it works for anon users (players/parents)
   * even when RLS blocks direct SELECT on players.
   */
  async getPlayerByCode(code) {
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) return null;

    // Call the RPC: public.get_player_by_code(code_input text)
    const res = await fetch(`${SUPABASE_API}/rpc/get_player_by_code`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ code_input: normalized })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('RPC get_player_by_code failed:', text);
      return null;
    }

    const data = await res.json();
    // RETURNS TABLE -> array of rows
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async addPlayer(playerData) {
    // Ensure we have a code – you can still use your existing UI or generate one here
    if (!playerData.code) {
      playerData.code = this.generateSecretCode();
    }
    playerData.code = playerData.code.toUpperCase();

    const res = await fetch(`${SUPABASE_API}/players`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify(playerData)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to create player:', text);
      throw new Error('Failed to create player');
    }

    // Prefer single-pass JSON parse
    const createdRows = await res.json();
    const created = Array.isArray(createdRows) ? createdRows[0] : createdRows;

    if (created) this._players.push(created);
    return created;
  },

  async updatePlayer(id, updates) {
    const res = await fetch(`${SUPABASE_API}/players?id=eq.${id}&select=*`, {
      method: 'PATCH',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to update player:', text);
      throw new Error('Failed to update player');
    }

    const updatedRows = await res.json();
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

    const idx = this._players.findIndex(p => String(p.id) === String(id));
    if (idx !== -1 && updated) {
      this._players[idx] = updated;
    }
    return updated;
  },

  async deletePlayer(id) {
    const res = await fetch(`${SUPABASE_API}/players?id=eq.${id}`, {
      method: 'DELETE',
      headers: SUPABASE_HEADERS
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to delete player:', text);
      throw new Error('Failed to delete player');
    }

    this._players = this._players.filter(p => String(p.id) !== String(id));
  },

  generateSecretCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = code.toUpperCase();
    if (this._players.some(p => p.code === code)) {
      return this.generateSecretCode();
    }
    return code;
  }
};

// Authentication System
const Auth = {
  isAdminLoggedIn() {
    return sessionStorage.getItem('adminLoggedIn') === 'true';
  },

  // NOTE: Your admin login page may already use Supabase Auth and not this method.
  // Keeping it here doesn't affect player portal.
  loginAdmin(username, password) {
    // Placeholder (if you still have older admin logic somewhere)
    // Prefer Supabase Auth on the admin-login page.
    return false;
  },

  logoutAdmin() {
    sessionStorage.removeItem('adminLoggedIn');
  },

  checkAdminAuth() {
    if (!this.isAdminLoggedIn()) {
      window.location.href = 'admin-login.html';
    }
  },

  getCurrentPlayerCode() {
    return sessionStorage.getItem('currentPlayerCode');
  },

  setCurrentPlayerCode(code) {
    sessionStorage.setItem('currentPlayerCode', code);
  },

  clearCurrentPlayerCode() {
    sessionStorage.removeItem('currentPlayerCode');
  }
};

// UI Helper Functions
const UI = {
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 4000);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  },

  getMetricRatingColor(level) {
    if (level >= 8) return '#2ecc71';
    if (level >= 6) return '#f39c12';
    return '#e74c3c';
  },

  getMetricRatingBadgeClass(level) {
    if (level >= 8) return 'badge-success';
    if (level >= 6) return 'badge-warning';
    return 'badge-danger';
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  DataManager.init();
});
