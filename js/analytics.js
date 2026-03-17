// TrackerU Analytics Module
// Chart.js integration for player performance visualization

'use strict';

const Analytics = {
  // Training type labels
  trainingTypes: {
    training: '🏋️ Training',
    game: '⚽ Game/Match',
    weekly: '📅 Weekly Review',
    biweekly: '📊 Bi-weekly Review',
    monthly: '📈 Monthly Review'
  },

  /**
   * Generate analytics data from player metrics with rating history
   * FIXED: Now properly tracks changes in real-time
   */
  generateAnalyticsData(player) {
    if (!player || !player.metrics) {
      return {
        hasData: false,
        message: 'No performance data available yet.'
      };
    }

    const allMetrics = this._collectAllMetricsWithHistory(player);
    
    if (allMetrics.length === 0) {
      return {
        hasData: false,
        message: 'No ratings recorded yet. Ask your coach to add ratings!'
      };
    }

    // Calculate statistics - FIXED: Recalculates on every load
    const stats = this._calculateStats(allMetrics, player);
    const trends = this._calculateTrends(allMetrics);
    const categoryAverages = this._calculateCategoryAverages(player);
    const ratingDistribution = this._calculateRatingDistribution(allMetrics);
    const improvementTimeline = this._calculateImprovementTimeline(allMetrics);
    
    return {
      hasData: true,
      stats,
      trends,
      categoryAverages,
      ratingDistribution,
      improvementTimeline,
      allMetrics
    };
  },

  /**
   * COACH ANALYTICS: Generate team-wide analytics
   */

  // --- Player DNA / Archetype Progression System ---
  generatePlayerDNA(player) {
    if (!player || !player.metrics) return null;

    // Build a flat lookup of all metric levels: { speed: 7, agility: 8, ... }
    const metricLevels = {};
    Object.values(player.metrics).forEach(category => {
      Object.entries(category).forEach(([key, val]) => {
        if (typeof val.level === 'number') {
          metricLevels[key] = val.level;
        }
      });
    });

    const allValues = Object.values(metricLevels);
    if (allValues.length === 0 || Math.max(...allValues) === 0) return null;

    // Require at least 5 rated metrics before assigning any DNA
    const ratedCount = allValues.filter(v => v > 0).length;
    if (ratedCount < 5) {
      return {
        notEnoughData: true,
        ratedCount,
        name: 'DNA Loading...',
        description: `${ratedCount} of 16 metrics evaluated. Your archetype will appear once more metrics are rated by your coach.`,
        gradient: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
        textColor: '#374151',
        topStats: [],
        tierDots: null,
        tierLabel: null
      };
    }

    // Top 3 highest-rated metrics (for display)
    const topStats = Object.entries(metricLevels)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);

    // Tier thresholds
    // Tier 3 (Full):      avg ≥ 7.5  AND  coverage ≥ 75%
    // Tier 2 (Developing): avg ≥ 6.0  AND  coverage ≥ 50%
    // Tier 1 (Potential):  avg ≥ 4.5  AND  2+ criteria rated
    const getTier = (avg, coverage) => {
      if (avg >= 7.5 && coverage >= 0.75) return 3;
      if (avg >= 6.0 && coverage >= 0.50) return 2;
      if (avg >= 4.5)                     return 1;
      return 0; // doesn't qualify
    };

    // 6 archetypes — each with 3 progressive tiers
    const archetypes = [
      {
        id: 'maestro',
        criteria: ['passing', 'decisionMaking', 'spaceUsage', 'ballControl', 'anticipation'],
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: 'white',
        tiers: [
          { name: 'The Playmaker',          description: "You read the game before others even see it. Keep sharpening your passing range and vision — a Maestro is being built." },
          { name: 'Maestro in the Making',  description: "You're orchestrating plays and finding rhythm in chaos. Tighten your decision-making and the whole game bends to your will." },
          { name: 'The Maestro 🎻',          description: "You control the game with elite vision, passing, and intelligence. The ball goes where you want it." }
        ]
      },
      {
        id: 'speedster',
        criteria: ['speed', 'agility', 'ballControl', 'stamina'],
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        textColor: '#1f2937',
        tiers: [
          { name: 'The Flyer',          description: "Raw pace that defenders notice. Keep combining your speed with better control and you'll be unstoppable in the open field." },
          { name: 'Speed Merchant',     description: "Your pace is becoming a real weapon. Add consistency in tight spaces and you'll turn defence into attack in seconds." },
          { name: 'The Speedster ⚡',   description: "Electric pace and razor-sharp agility. You're a nightmare for any defender who tries to keep up." }
        ]
      },
      {
        id: 'engine',
        criteria: ['stamina', 'performance', 'versatility', 'selfDevelopment'],
        gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
        textColor: 'white',
        tiers: [
          { name: 'The Workhorse',        description: "You never stop. Your effort lifts the team even on hard days. Channel that energy with more consistency and versatility." },
          { name: 'Engine Running Hot',   description: "Your work rate is becoming your trademark. Cover ground, fill gaps, outlast everyone — the full Engine is almost there." },
          { name: 'The Engine 🚂',         description: "Relentless energy. You cover every blade of grass and never stop working. The team runs on you." }
        ]
      },
      {
        id: 'wall',
        criteria: ['duels', 'anticipation', 'focus', 'emotionControl'],
        gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
        textColor: 'white',
        tiers: [
          { name: 'The Guardian',   description: "Defensive instincts are showing. You sense danger and step up when it matters. Build your composure and duel-winning ability." },
          { name: 'Wall Rising',    description: "You're becoming impossible to beat one-on-one. Your focus and reading of the game make you a headache for any attacker." },
          { name: 'The Wall 🛡️',    description: "A defensive rock. You win your duels and read the danger before it happens. Attackers dread you." }
        ]
      },
      {
        id: 'sniper',
        criteria: ['ballStriking', 'focus', 'decisionMaking', 'emotionControl'],
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        textColor: '#1f2937',
        tiers: [
          { name: 'The Marksman',          description: "You've got a natural eye for goal. Keep developing your technique and ice-cold composure under pressure." },
          { name: 'Sniper in the Making',  description: "Your finishing and focus are becoming a real weapon. One more gear of consistency and you'll be lethal every game." },
          { name: 'The Sniper 🎯',          description: "Ice cold in front of goal. Your striking technique is your superpower — defenders know it, goalkeepers fear it." }
        ]
      },
      {
        id: 'general',
        criteria: ['vocal', 'emotionControl', 'selfDevelopment', 'performance'],
        gradient: 'linear-gradient(135deg, #FDC830 0%, #F37335 100%)',
        textColor: 'white',
        tiers: [
          { name: 'The Voice',               description: "You speak up when it counts. Your emotional control and drive are noticed. Keep pushing standards for yourself and others." },
          { name: 'General in the Making',   description: "You're rallying the team and setting the tone. Sharpen your consistency and you'll command the field by voice alone." },
          { name: 'The General 🦁',           description: "A natural leader on and off the ball. You drive standards with your voice, mentality, and relentless example." }
        ]
      }
    ];

    // Score each archetype:
    // Use avgScore × coverage as the ranking score (penalises narrow fit).
    // Also track the tier each archetype qualifies for.
    let bestFit = null;
    let bestTier = 0;
    let bestRankScore = -1;

    archetypes.forEach(arch => {
      const ratedCriteria = arch.criteria
        .map(key => metricLevels[key])
        .filter(v => typeof v === 'number' && v > 0);

      if (ratedCriteria.length < 2) return; // Need at least 2 rated criteria

      const avgScore = ratedCriteria.reduce((sum, v) => sum + v, 0) / ratedCriteria.length;
      const coverage = ratedCriteria.length / arch.criteria.length;
      const tier = getTier(avgScore, coverage);

      if (tier === 0) return; // Doesn't meet minimum threshold

      const rankScore = avgScore * coverage;

      if (
        rankScore > bestRankScore ||
        (rankScore === bestRankScore && tier > bestTier)
      ) {
        bestRankScore = rankScore;
        bestTier = tier;
        bestFit = arch;
      }
    });

    // Fallback: well-rounded / no clear fit
    if (!bestFit) {
      return {
        name: 'The Prospect 💎',
        description: "A well-rounded player still carving out a unique style. Every great archetype starts here — keep earning your ratings.",
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        textColor: '#1f2937',
        topStats,
        tier: 0,
        tierLabel: 'Finding Your Path',
        tierDots: '○ ○ ○'
      };
    }

    const tierLabels = ['', 'Raw Potential', 'Archetype in Progress', 'Scouting Report Archetype'];
    const tierDots   = ['', '● ○ ○',         '● ● ○',                  '● ● ●'];

    return {
      id: bestFit.id,
      gradient: bestFit.gradient,
      textColor: bestFit.textColor,
      tier: bestTier,
      name: bestFit.tiers[bestTier - 1].name,
      description: bestFit.tiers[bestTier - 1].description,
      tierLabel: tierLabels[bestTier],
      tierDots: tierDots[bestTier],
      topStats
    };
  },


  generateCoachAnalytics(players) {
    if (!Array.isArray(players) || players.length === 0) {
      return {
        hasData: false,
        message: 'No players to analyze'
      };
    }

    const teamStats = {
      totalPlayers: players.length,
      playersWithData: 0,
      avgTeamRating: 0,
      totalRatings: 0,
      categoryAverages: {},
      topPerformers: [],
      needsAttention: [],
      mostImproved: [],
      recentActivity: []
    };

    let totalSum = 0;
    let totalCount = 0;
    const playerPerformances = [];

    // Category tracking
    const categoryTotals = {
      technical: { sum: 0, count: 0 },
      mentality: { sum: 0, count: 0 },
      intelligence: { sum: 0, count: 0 },
      athleticism: { sum: 0, count: 0 }
    };

    // Analyze each player
    players.forEach(player => {
      if (!player.metrics) return;

      let playerSum = 0;
      let playerCount = 0;
      let totalRatingsForPlayer = 0;
      let improvementCount = 0;

      Object.entries(player.metrics).forEach(([catKey, category]) => {
        Object.entries(category).forEach(([metricKey, metric]) => {
          if (!metric || typeof metric.level !== 'number') return;

          playerSum += metric.level;
          playerCount++;
          totalSum += metric.level;
          totalCount++;

          // Track by category
          if (categoryTotals[catKey]) {
            categoryTotals[catKey].sum += metric.level;
            categoryTotals[catKey].count++;
          }

          // Check improvement from history
          if (Array.isArray(metric.ratingHistory) && metric.ratingHistory.length >= 2) {
            totalRatingsForPlayer += metric.ratingHistory.length;
            const first = metric.ratingHistory[0].level;
            const last = metric.ratingHistory[metric.ratingHistory.length - 1].level;
            if (last > first) improvementCount++;
          }
        });
      });

      if (playerCount > 0) {
        teamStats.playersWithData++;
        const avgRating = playerSum / playerCount;
        const improvementRate = playerCount > 0 ? (improvementCount / playerCount) * 100 : 0;

        playerPerformances.push({
          id: player.id,
          name: `${player.firstName} ${player.lastName}`,
          avgRating: avgRating.toFixed(1),
          improvementRate: Math.round(improvementRate),
          totalRatings: totalRatingsForPlayer,
          position: player.position || 'N/A'
        });
      }
    });

    // Calculate team averages
    teamStats.avgTeamRating = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : 0;
    teamStats.totalRatings = totalCount;

    // Calculate category averages
    Object.entries(categoryTotals).forEach(([cat, data]) => {
      teamStats.categoryAverages[cat] = data.count > 0 ? (data.sum / data.count).toFixed(1) : 0;
    });

    // Sort players
    playerPerformances.sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating));
    teamStats.topPerformers = playerPerformances.slice(0, 5);
    teamStats.needsAttention = playerPerformances.filter(p => parseFloat(p.avgRating) < 6).slice(0, 5);
    
    // Most improved
    const byImprovement = [...playerPerformances].sort((a, b) => b.improvementRate - a.improvementRate);
    teamStats.mostImproved = byImprovement.slice(0, 5);

    return {
      hasData: true,
      ...teamStats
    };
  },

  /**
   * Collect all metrics with their rating history
   * FIXED: Now properly sorts and tracks all history entries
   */
  _collectAllMetricsWithHistory(player) {
    const metrics = [];
    const metricLabels = this._getMetricLabels();

    Object.entries(player.metrics).forEach(([catKey, category]) => {
      if (!category || typeof category !== 'object') return;
      
      Object.entries(category).forEach(([metricKey, metric]) => {
        if (!metric) return;
        
        // FIXED: Always use rating history if available, otherwise create initial entry
        let history = Array.isArray(metric.ratingHistory) && metric.ratingHistory.length > 0
          ? [...metric.ratingHistory]
          : [{
              level: metric.level,
              comment: metric.comment || '',
              date: new Date().toISOString().split('T')[0],
              context: 'initial',
              contextDate: null
            }];

        // Sort history by date
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        metrics.push({
          key: metricKey,
          category: catKey,
          label: metricLabels[metricKey] || metricKey,
          currentLevel: metric.level,
          history
        });
      });
    });

    return metrics;
  },

  /**
   * Calculate overall statistics
   * FIXED: Now properly counts all ratings and improvements
   */
  _calculateStats(allMetrics, player) {
    let totalRatings = 0;
    let sumRatings = 0;
    let improvementCount = 0;
    let declineCount = 0;
    let stableCount = 0;

    allMetrics.forEach(metric => {
      const history = metric.history;
      totalRatings += history.length;
      sumRatings += metric.currentLevel;

      if (history.length >= 2) {
        const first = history[0].level;
        const last = history[history.length - 1].level;
        const change = last - first;
        
        if (change > 0.5) improvementCount++;
        else if (change < -0.5) declineCount++;
        else stableCount++;
      } else {
        stableCount++;
      }
    });

    const avgRating = allMetrics.length > 0 ? (sumRatings / allMetrics.length).toFixed(1) : 0;
    const improvementRate = allMetrics.length > 0 
      ? Math.round((improvementCount / allMetrics.length) * 100) 
      : 0;

    return {
      totalMetrics: allMetrics.length,
      totalRatings,
      avgRating,
      improvementCount,
      declineCount,
      stableCount,
      improvementRate
    };
  },

  /**
   * Calculate trends for each metric
   * FIXED: Now accurately tracks changes over time
   */
  _calculateTrends(allMetrics) {
    return allMetrics.map(metric => {
      const history = metric.history;
      
      if (history.length < 2) {
        return {
          ...metric,
          trend: 'stable',
          change: 0,
          firstRating: metric.currentLevel,
          lastRating: metric.currentLevel,
          percentChange: 0
        };
      }

      const first = history[0].level;
      const last = history[history.length - 1].level;
      const change = last - first;
      const percentChange = first > 0 ? ((change / first) * 100).toFixed(1) : 0;
      
      let trend = 'stable';
      if (change > 0.5) trend = 'improving';
      else if (change < -0.5) trend = 'declining';

      return {
        ...metric,
        trend,
        change: parseFloat(change.toFixed(1)),
        firstRating: first,
        lastRating: last,
        percentChange,
        totalUpdates: history.length
      };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  },

  /**
   * Calculate improvement timeline (for trend chart)
   * NEW: Shows overall improvement over time
   */
  _calculateImprovementTimeline(allMetrics) {
    const dateMap = new Map();

    allMetrics.forEach(metric => {
      metric.history.forEach(entry => {
        if (!dateMap.has(entry.date)) {
          dateMap.set(entry.date, { sum: 0, count: 0 });
        }
        const data = dateMap.get(entry.date);
        data.sum += entry.level;
        data.count++;
      });
    });

    const timeline = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        avgRating: (data.sum / data.count).toFixed(1),
        count: data.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return timeline;
  },

  /**
   * Calculate category averages
   * FIXED: Uses current ratings for accuracy
   */
  _calculateCategoryAverages(player) {
    const categoryLabels = {
      technical: '⚡ Technical',
      mentality: '🧠 Mentality',
      intelligence: '🎯 Intelligence',
      athleticism: '💪 Athleticism'
    };

    const averages = [];

    Object.entries(player.metrics).forEach(([catKey, category]) => {
      if (!category || typeof category !== 'object') return;
      
      let sum = 0;
      let count = 0;

      Object.values(category).forEach(metric => {
        if (metric && typeof metric.level === 'number') {
          sum += metric.level;
          count++;
        }
      });

      if (count > 0) {
        averages.push({
          category: catKey,
          label: categoryLabels[catKey] || catKey,
          average: Number((sum / count).toFixed(1)),
          count
        });
      }
    });

    return averages;
  },

  /**
   * Calculate rating distribution (how many ratings at each level)
   * FIXED: Uses current levels
   */
  _calculateRatingDistribution(allMetrics) {
    const distribution = Array(10).fill(0).map((_, i) => ({
      level: i + 1,
      count: 0
    }));

    allMetrics.forEach(metric => {
      const level = Math.round(metric.currentLevel);
      if (level >= 1 && level <= 10) {
        distribution[level - 1].count++;
      }
    });

    return distribution;
  },

  /**
   * Create improvement timeline chart (line chart)
   * FIXED: Now shows all historical data points
   */
  createTimelineChart(canvasId, player, metricKey = null) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const datasets = [];
    const allMetrics = this._collectAllMetricsWithHistory(player);
    const metricsToPlot = metricKey 
      ? allMetrics.filter(m => m.key === metricKey)
      : allMetrics.slice(0, 5); // Top 5 metrics

    const colors = [
      '#1e3c72', '#2ecc71', '#f39c12', '#e74c3c', '#3498db',
      '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#16a085'
    ];

    metricsToPlot.forEach((metric, idx) => {
      const history = [...metric.history].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      datasets.push({
        label: metric.label,
        data: history.map(h => ({
          x: h.date,
          y: h.level
        })),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '33',
        tension: 0.3,
        fill: false
      });
    });

    return new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: { day: 'MMM d' }
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            min: 0,
            max: 10,
            title: {
              display: true,
              text: 'Rating Level'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const dataIndex = context.dataIndex;
                const datasetIndex = context.datasetIndex;
                const metric = metricsToPlot[datasetIndex];
                const rating = metric.history[dataIndex];
                let label = '';
                if (rating.comment) label += `\nComment: ${rating.comment}`;
                if (rating.context) label += `\nType: ${rating.context}`;
                return label;
              }
            }
          }
        }
      }
    });
  },

  /**
   * Create category radar chart
   */
  createRadarChart(canvasId, categoryAverages) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: categoryAverages.map(c => c.label),
        datasets: [{
          label: 'Current Performance',
          data: categoryAverages.map(c => c.average),
          backgroundColor: 'rgba(30, 60, 114, 0.2)',
          borderColor: 'rgba(30, 60, 114, 1)',
          pointBackgroundColor: 'rgba(30, 60, 114, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(30, 60, 114, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  },

  /**
   * Create rating distribution pie chart
   */
  createDistributionChart(canvasId, distribution) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Filter out zero counts and group into ranges
    const ranges = [
      { label: 'Needs Work (1-3)', min: 1, max: 3, color: '#e74c3c' },
      { label: 'Developing (4-6)', min: 4, max: 6, color: '#f39c12' },
      { label: 'Strong (7-8)', min: 7, max: 8, color: '#3498db' },
      { label: 'Elite (9-10)', min: 9, max: 10, color: '#2ecc71' }
    ];

    const data = ranges.map(range => {
      return distribution
        .filter(d => d.level >= range.min && d.level <= range.max)
        .reduce((sum, d) => sum + d.count, 0);
    });

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ranges.map(r => r.label),
        datasets: [{
          data,
          backgroundColor: ranges.map(r => r.color),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * Create category comparison bar chart
   */
  createCategoryBarChart(canvasId, categoryAverages) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categoryAverages.map(c => c.label),
        datasets: [{
          label: 'Average Rating',
          data: categoryAverages.map(c => c.average),
          backgroundColor: [
            'rgba(30, 60, 114, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(243, 156, 18, 0.8)',
            'rgba(231, 76, 60, 0.8)'
          ],
          borderColor: [
            'rgba(30, 60, 114, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(243, 156, 18, 1)',
            'rgba(231, 76, 60, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2
            },
            title: {
              display: true,
              text: 'Average Rating'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  },

  /**
   * NEW: Create coach team overview chart
   */
  createTeamOverviewChart(canvasId, coachAnalytics) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const categories = ['Technical', 'Mentality', 'Intelligence', 'Athleticism'];
    const data = [
      coachAnalytics.categoryAverages.technical || 0,
      coachAnalytics.categoryAverages.mentality || 0,
      coachAnalytics.categoryAverages.intelligence || 0,
      coachAnalytics.categoryAverages.athleticism || 0
    ];

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Team Average by Category',
          data,
          backgroundColor: [
            'rgba(30, 60, 114, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(243, 156, 18, 0.8)',
            'rgba(231, 76, 60, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 10,
            title: {
              display: true,
              text: 'Average Rating'
            }
          }
        }
      }
    });
  },

  /**
   * Filter metrics by context type
   */
  filterByContext(allMetrics, contextType) {
    if (!contextType || contextType === 'all') return allMetrics;

    return allMetrics.map(metric => ({
      ...metric,
      history: metric.history.filter(h => h.context === contextType)
    })).filter(m => m.history.length > 0);
  },

  /**
   * Filter metrics by date range
   */
  filterByDateRange(allMetrics, startDate, endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    return allMetrics.map(metric => ({
      ...metric,
      history: metric.history.filter(h => {
        const date = new Date(h.date);
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
      })
    })).filter(m => m.history.length > 0);
  },

  /**
   * Get metric labels
   */
  _getMetricLabels() {
    return {
      ballControl: 'Ball Control',
      ballStriking: 'Ball Striking',
      passing: 'Passing',
      duels: '1v1 Duels',
      emotionControl: 'Emotion Control',
      selfDevelopment: 'Self Development',
      vocal: 'Vocal Leadership',
      performance: 'Performance',
      focus: 'Focus',
      anticipation: 'Anticipation',
      decisionMaking: 'Decision Making',
      versatility: 'Versatility',
      spaceUsage: 'Space Usage',
      agility: 'Agility',
      speed: 'Speed',
      stamina: 'Stamina'
    };
  },

  /**
   * Destroy a chart instance
   */
  destroyChart(chart) {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  }
};

// Make Analytics globally available
if (typeof window !== 'undefined') {
  window.Analytics = Analytics;
}
