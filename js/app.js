
// TrackerU - Main Application Logic

// Supabase configuration
const SUPABASE_URL = 'https://...';   // <- paste from Supabase
const SUPABASE_ANON_KEY = '...';        // <- paste anon key

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
      if (!res.ok) {
        console.error('Failed to fetch players from Supabase', await res.text());
        this._players = [];
      } else {
        this._players = await res.json();
      }
      this._initialized = true;
    } catch (err) {
      console.error('Error loading players from Supabase:', err);
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

  getPlayerByCode(code) {
    const normalized = code.trim().toUpperCase();
    return this._players.find(p => p.code === normalized) || null;
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

    const created = (await res.json())[0] || (await res.json());
    // Supabase REST returns either the row or array depending on settings; handle both
    if (Array.isArray(created)) {
      this._players.push(created[0]);
      return created[0];
    } else {
      this._players.push(created);
      return created;
    }
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
  
  loginAdmin(username, password) {
    if (username === DataManager.ADMIN_USERNAME && password === DataManager.ADMIN_PASSWORD) {
      sessionStorage.setItem('adminLoggedIn', 'true');
      return true;
    }
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

// Simple rule-based "AI" helper for player summaries
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
    const overallScore = Math.round(rawAvg * 10) / 10; // 1 decimal

    const sorted = [...metrics].sort((a, b) => b.level - a.level);
    const strengths = sorted.slice(0, 3);
    const weaknesses = sorted.slice(-3).reverse(); // lowest first

    const name = player.firstName ? player.firstName : 'This player';

    let overallBand;
    if (overallScore >= 8) {
      overallBand = 'at a very strong overall level';
    } else if (overallScore >= 6.5) {
      overallBand = 'at a solid overall level';
    } else if (overallScore >= 5) {
      overallBand = 'developing with room for growth in several areas';
    } else {
      overallBand = 'in an early development stage and building foundations';
    }

    const overallText = `${name} is currently performing ${overallBand} (around ${overallScore}/10 across all tracked areas).`;

    const strengthsText = strengths.length
      ? `${this._joinLabels(strengths)} stand out as current strengths.`
      : 'No clear strengths identified yet – add more ratings to see them here.';

    const focusText = weaknesses.length
      ? `${this._joinLabels(weaknesses)} are the main priorities for improvement over the next phase.`
      : 'No clear focus areas identified yet – add more ratings to see them here.';

    return {
      overallScore,
      strengths,
      weaknesses,
      overallText,
      strengthsText,
      focusText
    };
  }
};


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  DataManager.init();
});
