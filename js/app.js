
// TrackerU - Main Application Logic
// Front-end only (GitHub Pages friendly)
// Uses Supabase Auth + PostgREST via supabase-js to enable real-time sync across devices.

'use strict';

// =========================
// Supabase configuration
// =========================
const SUPABASE_URL = 'https://axrqkbdgcvsyoxlbuwoh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnFrYmRnY3ZzeW94bGJ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTU4MTcsImV4cCI6MjA4MTA3MTgxN30.kTP1WkLi9dkU5VB6egAF6IehYVURVV2inIju_2ckTHQ';

// supabase-js must be loaded before this file:
// <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
if (typeof window.supabase === 'undefined') {
  console.warn(
    'Supabase JS is not loaded. Add <script src="https://unpkg.com/@supabase/supabase-js@2"></script> before app.js'
  );
}

const supabaseClient = (typeof window.supabase !== 'undefined')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// =========================
// UI Helper Functions
// =========================
const UI = {
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '420px';

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

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

// =========================
// Auth (Supabase Auth)
// =========================
const Auth = {
  async loginAdmin(email, password) {
    if (!supabaseClient) throw new Error('Supabase client not available.');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user };
  },

  async logoutAdmin() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
  },

  async getSession() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getSession();
    return data.session || null;
  },

  async getUser() {
    if (!supabaseClient) return null;
    const { data } = await supabaseClient.auth.getUser();
    return data.user || null;
  },

  // Gate admin pages
  async checkAdminAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  },

  // Player portal "session" (still code-based, not Supabase Auth)
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

// =========================
// Data Manager (Supabase DB)
// =========================
const DataManager = {
  _players: [],
  _initialized: false,

  async init(force = false) {
    if (!supabaseClient) {
      this._players = [];
      this._initialized = true;
      return;
    }
    if (this._initialized && !force) return;

    // If logged in as an admin, RLS will allow reading that admin's players.
    // If not logged in, this will likely return [] (depending on your RLS policies).
    const { data, error } = await supabaseClient
      .from('players')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Failed to fetch players:', error.message);
      this._players = [];
    } else {
      this._players = Array.isArray(data) ? data : [];
    }
    this._initialized = true;
  },

  getPlayers() {
    return this._players;
  },

  getPlayerById(id) {
    return this._players.find(p => String(p.id) === String(id)) || null;
  },

  /**
 * Lookup a player by their secret code. First searches the in-memory
 * _players cache (for admins), then falls back to calling the
 * get_player_by_code RPC for anonymous users.
 */
async getPlayerByCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;

  // If cache has players (admin logged in), search locally
  if (Array.isArray(this._players) && this._players.length > 0) {
    const localMatch = this._players.find(p => p.code === normalized);
    if (localMatch) return localMatch;
  }

  // Otherwise call the Supabase RPC
  try {
    const res = await fetch(`${SUPABASE_URL}/rpc/get_player_by_code`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ code_input: normalized })
    });
    if (!res.ok) {
      console.error('RPC get_player_by_code failed:', await res.text());
      return null;
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Error during RPC get_player_by_code:', err);
    return null;
  }
},


  generateSecretCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code = code.toUpperCase();
    if (this._players.some(p => String(p.code).toUpperCase() === code)) return this.generateSecretCode();
    return code;
  },

  async addPlayer(playerData) {
    if (!supabaseClient) throw new Error('Supabase client not available.');

    const user = await Auth.getUser();
    if (!user) throw new Error('You must be logged in as an admin to add players.');

    const payload = {
      ...playerData,
      code: (playerData.code || this.generateSecretCode()).toUpperCase(),
      admin_id: user.id,
      assignedVideos: playerData.assignedVideos || [],
      metrics: playerData.metrics || {}
    };

    const { data, error } = await supabaseClient
      .from('players')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create player:', error.message);
      throw new Error(error.message);
    }

    this._players.push(data);
    return data;
  },

  async updatePlayer(id, updates) {
    if (!supabaseClient) throw new Error('Supabase client not available.');

    const { data, error } = await supabaseClient
      .from('players')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to update player:', error.message);
      throw new Error(error.message);
    }

    const idx = this._players.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) this._players[idx] = data;
    return data;
  },

  async deletePlayer(id) {
    if (!supabaseClient) throw new Error('Supabase client not available.');

    const { error } = await supabaseClient
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete player:', error.message);
      throw new Error(error.message);
    }

    this._players = this._players.filter(p => String(p.id) !== String(id));
  },

  async addVideo(playerId, video) {
    const player = this.getPlayerById(playerId);
    if (!player) throw new Error('Player not found.');

    const assignedVideos = Array.isArray(player.assignedVideos) ? [...player.assignedVideos] : [];
    assignedVideos.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: String(video.title || '').trim(),
      url: String(video.url || '').trim(),
      assignedDate: new Date().toISOString()
    });

    return await this.updatePlayer(playerId, { assignedVideos });
  },

  async removeVideo(playerId, videoId) {
    const player = this.getPlayerById(playerId);
    if (!player) throw new Error('Player not found.');

    const assignedVideos = (player.assignedVideos || []).filter(v => v.id !== videoId);
    return await this.updatePlayer(playerId, { assignedVideos });
  },

  async submitAdminRequest(request) {
    if (!supabaseClient) throw new Error('Supabase client not available.');

    const payload = {
      firstName: (request.firstName || '').trim(),
      lastName: (request.lastName || '').trim(),
      team: (request.team || '').trim(),
      notes: (request.notes || '').trim()
    };

    const { error } = await supabaseClient
      .from('admin_requests')
      .insert(payload);

    if (error) {
      console.error('Failed to submit admin request:', error.message);
      throw new Error(error.message);
    }
  }
};

// =========================
// Simple rule-based "AI" helper for player summaries
// =========================
const AI = {
  _categoryLabels: {
    technical: 'technical skills',
    mentality: 'mentality',
    intelligence: 'soccer intelligence',
    athleticism: 'athleticism'
  },

  _metricLabels: {
    ballControl: 'ball control (first touch & receiving)',
    ballStriking: 'ball striking (shooting & long passing)',
    passing: 'short and long passing',
    duels: '1v1 duel ability',
    emotionControl: 'emotion control',
    selfDevelopment: 'taking charge of their own development',
    vocal: 'vocal leadership',
    performance: 'performance consistency',
    focus: 'focus & concentration',
    anticipation: 'game anticipation and reading play',
    decisionMaking: 'decision making',
    versatility: 'versatility (playing multiple roles)',
    spaceUsage: 'use and creation of space',
    agility: 'agility',
    speed: 'speed',
    stamina: 'stamina'
  },

  _collectMetrics(player) {
    const metrics = [];
    if (!player || !player.metrics) return metrics;

    Object.entries(player.metrics).forEach(([catKey, category]) => {
      if (!category || typeof category !== 'object') return;
      Object.entries(category).forEach(([metricKey, metric]) => {
        if (!metric || typeof metric.level !== 'number') return;
        metrics.push({
          key: metricKey,
          label: this._metricLabels[metricKey] || metricKey,
          category: this._categoryLabels[catKey] || catKey,
          level: metric.level
        });
      });
    });

    return metrics;
  },

  _joinLabels(items) {
    const labels = items.map(i => i.label);
    if (labels.length === 0) return '';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  },

  generatePlayerSummary(player) {
    const metrics = this._collectMetrics(player);

    if (metrics.length === 0) {
      return {
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        overallText: 'We do not have enough rating data yet to generate a development summary.',
        strengthsText: 'Rate a few areas to see strengths here.',
        focusText: 'Rate a few areas to see focus points here.'
      };
    }

    const total = metrics.reduce((sum, m) => sum + m.level, 0);
    const rawAvg = total / metrics.length;
    const overallScore = Math.round(rawAvg * 10) / 10;

    const sorted = [...metrics].sort((a, b) => b.level - a.level);
    const strengths = sorted.slice(0, 3);
    const weaknesses = sorted.slice(-3).reverse();

    const name = player.firstName ? player.firstName : 'This player';

    let overallBand;
    if (overallScore >= 8) overallBand = 'at a very strong overall level';
    else if (overallScore >= 6.5) overallBand = 'at a solid overall level';
    else if (overallScore >= 5) overallBand = 'developing with room for growth in several areas';
    else overallBand = 'in an early development stage and building foundations';

    const overallText = `${name} is currently performing ${overallBand} (around ${overallScore}/10 across all tracked areas).`;
    const strengthsText = strengths.length ? `${this._joinLabels(strengths)} stand out as current strengths.` : 'No clear strengths identified yet – add more ratings.';
    const focusText = weaknesses.length ? `${this._joinLabels(weaknesses)} are the main priorities for improvement over the next phase.` : 'No clear focus areas identified yet – add more ratings.';

    return { overallScore, strengths, weaknesses, overallText, strengthsText, focusText };
  }
};

// Optional: preload cache on every page (safe)
document.addEventListener('DOMContentLoaded', () => {
  // Do not block page load on this.
  DataManager.init().catch(() => {});
});
