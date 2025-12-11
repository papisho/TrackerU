
// TrackerU - Main Application Logic

// Data Management System
const DataManager = {
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'password123',
  
  init() {
    if (!localStorage.getItem('trackerU_players')) {
      this.setPlayers(this.getDefaultPlayers());
    }
  },
  
  getPlayers() {
    return JSON.parse(localStorage.getItem('trackerU_players') || '[]');
  },
  
  setPlayers(players) {
    localStorage.setItem('trackerU_players', JSON.stringify(players));
  },
  
  getPlayerByCode(code) {
    const players = this.getPlayers();
    return players.find(p => p.code === code);
  },
  
  getPlayerById(id) {
    const players = this.getPlayers();
    return players.find(p => p.id === id);
  },
  
  addPlayer(playerData) {
    const players = this.getPlayers();
    const newPlayer = {
      id: Date.now().toString(),
      code: this.generateSecretCode(),
      createdAt: new Date().toISOString(),
      ...playerData
    };
    players.push(newPlayer);
    this.setPlayers(players);
    return newPlayer;
  },
  
  updatePlayer(id, updates) {
    let players = this.getPlayers();
    players = players.map(p => p.id === id ? { ...p, ...updates } : p);
    this.setPlayers(players);
  },
  
  deletePlayer(id) {
    let players = this.getPlayers();
    players = players.filter(p => p.id !== id);
    this.setPlayers(players);
  },
  
  generateSecretCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
  
  getDefaultPlayers() {
    return [
      {
        id: '1',
        code: 'ABC12',
        firstName: 'Marcus',
        lastName: 'Johnson',
        position: 'Forward',
        jerseyNumber: 9,
        dateOfBirth: '2008-05-15',
        metrics: {
          technical: {
            ballControl: { level: 7, comment: 'Good ball control, needs better first touch' },
            ballStriking: { level: 6, comment: 'Decent shot power, practice accuracy' },
            passing: { level: 7, comment: 'Good vision, accurate short passes' },
            duels: { level: 6, comment: 'Works hard, can be more physical' }
          },
          mentality: {
            emotionControl: { level: 7, comment: 'Stays calm during games' },
            selfDevelopment: { level: 8, comment: 'Very dedicated, always improving' },
            vocal: { level: 6, comment: 'Could lead more on field' },
            performance: { level: 7, comment: 'Consistent performer' },
            focus: { level: 7, comment: 'Good concentration' }
          },
          intelligence: {
            anticipation: { level: 6, comment: 'Decent positioning' },
            decisionMaking: { level: 7, comment: 'Makes smart choices under pressure' },
            versatility: { level: 5, comment: 'Plays mainly as striker' },
            spaceUsage: { level: 7, comment: 'Good movement off the ball' }
          },
          athleticism: {
            agility: { level: 7, comment: 'Quick feet, good balance' },
            speed: { level: 8, comment: 'Very fast, explosive' },
            stamina: { level: 7, comment: 'Good endurance, can improve late game' }
          }
        },
        assignedVideos: [
          { id: '1', title: 'Finishing Drills', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', assignedDate: '2024-12-01' },
          { id: '2', title: 'First Touch Techniques', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', assignedDate: '2024-12-05' }
        ]
      },
      {
        id: '2',
        code: 'XYZ99',
        firstName: 'David',
        lastName: 'Miller',
        position: 'Midfield',
        jerseyNumber: 7,
        dateOfBirth: '2007-08-22',
        metrics: {
          technical: {
            ballControl: { level: 8, comment: 'Excellent dribbler' },
            ballStriking: { level: 7, comment: 'Good shooting technique' },
            passing: { level: 8, comment: 'Outstanding playmaker' },
            duels: { level: 7, comment: 'Strong in challenges' }
          },
          mentality: {
            emotionControl: { level: 8, comment: 'Very composed' },
            selfDevelopment: { level: 9, comment: 'Natural leader' },
            vocal: { level: 8, comment: 'Vocal leader on pitch' },
            performance: { level: 8, comment: 'Always at his best' },
            focus: { level: 8, comment: 'Excellent concentration' }
          },
          intelligence: {
            anticipation: { level: 8, comment: 'Reads game exceptionally' },
            decisionMaking: { level: 8, comment: 'Makes intelligent passes' },
            versatility: { level: 7, comment: 'Can play multiple positions' },
            spaceUsage: { level: 8, comment: 'Creates space for teammates' }
          },
          athleticism: {
            agility: { level: 8, comment: 'Very agile and balanced' },
            speed: { level: 7, comment: 'Good pace for a midfielder' },
            stamina: { level: 9, comment: 'Outstanding fitness' }
          }
        },
        assignedVideos: [
          { id: '1', title: 'Midfield Positioning', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', assignedDate: '2024-12-03' }
        ]
      }
    ];
  },
  
  addVideo(playerId, videoData) {
    const player = this.getPlayerById(playerId);
    if (player) {
      if (!player.assignedVideos) {
        player.assignedVideos = [];
      }
      const newVideo = {
        id: Date.now().toString(),
        assignedDate: new Date().toISOString().split('T')[0],
        ...videoData
      };
      player.assignedVideos.push(newVideo);
      this.updatePlayer(playerId, player);
      return newVideo;
    }
  },
  
  removeVideo(playerId, videoId) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.assignedVideos = player.assignedVideos.filter(v => v.id !== videoId);
      this.updatePlayer(playerId, player);
    }
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
