// Rewards & Badges System for TrackerU
// Handles points, badges, attendance tracking, and coach-controlled rewards

const Rewards = {

  // Points configuration
  POINTS: {
    VIDEO_WATCHED: 10,        // Points for watching a full video
    ATTENDANCE_PRESENT: 5,     // Points per attendance
    ATTENDANCE_STREAK_3: 15,   // Bonus for 3 consecutive attendances
    ATTENDANCE_STREAK_5: 30,   // Bonus for 5 consecutive attendances
    IMPROVEMENT_SMALL: 20,     // 5-10% improvement
    IMPROVEMENT_MEDIUM: 40,    // 10-20% improvement
    IMPROVEMENT_LARGE: 60,     // 20%+ improvement
    PERFECT_CATEGORY: 50,      // All metrics in a category at 8+
    ELITE_METRIC: 25,          // Single metric reaches 9+
    ATTENDANCE_ABSENT_OTHER: -5 // 
  },

  // Badge definitions
  BADGES: {
    // Video watching badges
    VIDEO_STARTER: { id: 'video_starter', name: '🎬 Video Starter', description: 'Watched your first training video', icon: '🎬', requirement: { type: 'videos_watched', count: 1 }, points: 0 },
    VIDEO_ENTHUSIAST: { id: 'video_enthusiast', name: '📺 Video Enthusiast', description: 'Watched 5 training videos', icon: '📺', requirement: { type: 'videos_watched', count: 5 }, points: 0 },
    VIDEO_MASTER: { id: 'video_master', name: '🏆 Video Master', description: 'Watched 10 training videos', icon: '🏆', requirement: { type: 'videos_watched', count: 10 }, points: 0 },

    // Attendance badges
    ATTENDANCE_ROOKIE: { id: 'attendance_rookie', name: '✅ Attendance Rookie', description: 'Attended 5 sessions', icon: '✅', requirement: { type: 'attendance_count', count: 5 }, points: 0 },
    ATTENDANCE_PRO: { id: 'attendance_pro', name: '🎯 Attendance Pro', description: 'Attended 15 sessions', icon: '🎯', requirement: { type: 'attendance_count', count: 15 }, points: 0 },
    ATTENDANCE_LEGEND: { id: 'attendance_legend', name: '👑 Attendance Legend', description: 'Attended 30 sessions', icon: '👑', requirement: { type: 'attendance_count', count: 30 }, points: 0 },
    PERFECT_ATTENDANCE: { id: 'perfect_attendance', name: '💯 Perfect Attendance', description: '100% attendance for a month', icon: '💯', requirement: { type: 'perfect_month', count: 1 }, points: 0 },

    // Streak badges
    STREAK_3: { id: 'streak_3', name: '🔥 On Fire', description: '3-day attendance streak', icon: '🔥', requirement: { type: 'streak', count: 3 }, points: 0 },
    STREAK_5: { id: 'streak_5', name: '⚡ Unstoppable', description: '5-day attendance streak', icon: '⚡', requirement: { type: 'streak', count: 5 }, points: 0 },
    STREAK_10: { id: 'streak_10', name: '🌟 Superstar', description: '10-day attendance streak', icon: '🌟', requirement: { type: 'streak', count: 10 }, points: 0 },

    // Performance badges
    FIRST_IMPROVEMENT: { id: 'first_improvement', name: '📈 First Steps', description: 'First metric improvement', icon: '📈', requirement: { type: 'any_improvement', count: 1 }, points: 0 },
    RISING_STAR: { id: 'rising_star', name: '⭐ Rising Star', description: '10% overall improvement', icon: '⭐', requirement: { type: 'improvement_rate', percent: 10 }, points: 0 },
    BREAKOUT_PLAYER: { id: 'breakout_player', name: '💫 Breakout Player', description: '20% overall improvement', icon: '💫', requirement: { type: 'improvement_rate', percent: 20 }, points: 0 },
    ELITE_PERFORMER: { id: 'elite_performer', name: '👑 Elite Performer', description: 'Average rating of 8.0+', icon: '👑', requirement: { type: 'average_rating', rating: 8.0 }, points: 0 },

    // Skill mastery badges
    TECHNICAL_MASTER: { id: 'technical_master', name: '⚡ Technical Master', description: 'All technical skills at 8+', icon: '⚡', requirement: { type: 'category_mastery', category: 'technical', rating: 8 }, points: 0 },
    MENTAL_WARRIOR: { id: 'mental_warrior', name: '🧠 Mental Warrior', description: 'All mentality metrics at 8+', icon: '🧠', requirement: { type: 'category_mastery', category: 'mentality', rating: 8 }, points: 0 },
    SOCCER_IQ: { id: 'soccer_iq', name: '🎯 Soccer IQ', description: 'All intelligence metrics at 8+', icon: '🎯', requirement: { type: 'category_mastery', category: 'intelligence', rating: 8 }, points: 0 },
    ATHLETIC_BEAST: { id: 'athletic_beast', name: '💪 Athletic Beast', description: 'All athleticism metrics at 8+', icon: '💪', requirement: { type: 'category_mastery', category: 'athleticism', rating: 8 }, points: 0 },

    // Points milestone badges
    POINTS_100: { id: 'points_100', name: '🥉 Bronze Achiever', description: 'Earned 100 points', icon: '🥉', requirement: { type: 'total_points', count: 100 }, points: 0 },
    POINTS_250: { id: 'points_250', name: '🥈 Silver Achiever', description: 'Earned 250 points', icon: '🥈', requirement: { type: 'total_points', count: 250 }, points: 0 },
    POINTS_500: { id: 'points_500', name: '🥇 Gold Achiever', description: 'Earned 500 points', icon: '🥇', requirement: { type: 'total_points', count: 500 }, points: 0 },
    POINTS_1000: { id: 'points_1000', name: '💎 Diamond Achiever', description: 'Earned 1000 points', icon: '💎', requirement: { type: 'total_points', count: 1000 }, points: 0 }
  },

  // Initialize player rewards data
  // FIXED: Now robustly checks all properties even if rewards object exists
  initializePlayerRewards(player) {
    if (!player.rewards) {
      player.rewards = {};
    }

    // Ensure all arrays and counters exist
    if (typeof player.rewards.totalPoints !== 'number') player.rewards.totalPoints = 0;
    if (!Array.isArray(player.rewards.earnedBadges)) player.rewards.earnedBadges = [];
    if (!Array.isArray(player.rewards.videoWatchHistory)) player.rewards.videoWatchHistory = [];
    if (!Array.isArray(player.rewards.attendanceHistory)) player.rewards.attendanceHistory = [];
    if (typeof player.rewards.currentStreak !== 'number') player.rewards.currentStreak = 0;
    if (typeof player.rewards.longestStreak !== 'number') player.rewards.longestStreak = 0;
    if (!Array.isArray(player.rewards.pointsHistory)) player.rewards.pointsHistory = [];

    return player;
  },

  // Award points to a player
  awardPoints(player, points, reason, metadata = {}) {
    player = this.initializePlayerRewards(player);
    
    player.rewards.totalPoints += points;
    player.rewards.pointsHistory.push({
      points,
      reason,
      metadata,
      date: new Date().toISOString()
    });

    return player;
  },

  // Deduct points (for redeeming rewards)
  redeemReward(player, cost, rewardName) {
    player = this.initializePlayerRewards(player);
    
    if (player.rewards.totalPoints < cost) {
      throw new Error('Insufficient points');
    }

    player.rewards.totalPoints -= cost;
    player.rewards.pointsHistory.push({
      points: -cost,
      reason: `Redeemed: ${rewardName}`,
      date: new Date().toISOString()
    });

    return player;
  },

  // Record video watch completion
  recordVideoWatch(player, videoId, watchData) {
    player = this.initializePlayerRewards(player);
    
    // Check if video already watched
    const alreadyWatched = player.rewards.videoWatchHistory.find(v => v.videoId === videoId);
    if (alreadyWatched) return player;

    if (watchData.speed > 1.2 || watchData.completion < 95) return player;

    // Award points
    player = this.awardPoints(player, this.POINTS.VIDEO_WATCHED, 'Watched training video', {
      videoId,
      watchTime: watchData.watchTime,
      speed: watchData.speed
    });

    // Record watch
    player.rewards.videoWatchHistory.push({
      videoId,
      watchedAt: new Date().toISOString(),
      watchTime: watchData.watchTime,
      speed: watchData.speed
    });

    return player;
  },

  // Record attendance
  recordAttendance(player, sessionDate, isPresent, sessionType = 'training', absenceReason = 'other') {
    player = this.initializePlayerRewards(player);

    const dateKey = String(sessionDate || '').split('T')[0];
    if (!dateKey) return player;


    // Prevent duplicate record for same date + sessionType
    const existingRecord = player.rewards.attendanceHistory.find(a => {
      const aDateKey = String(a.date || '').split('T')[0];
      const aSessionType = a.sessionType || 'training';
      return aDateKey === dateKey && aSessionType === (sessionType || 'training');
    });
    if (existingRecord) return player;

    const present = Boolean(isPresent);
    const normalizedAbsenceReason = present ? null : (absenceReason === 'excused' ? 'excused' : 'other');

    player.rewards.attendanceHistory.push({
      date: dateKey,
      sessionType: sessionType || 'training',
      present,
      absenceReason: normalizedAbsenceReason,
      recordedAt: new Date().toISOString()
    });

    if (present) {
      player = this.awardPoints(player, this.POINTS.ATTENDANCE_PRESENT, 'Attended session', { date: dateKey, sessionType });
      player = this.updateStreak(player);

      if (player.rewards.currentStreak === 3) {
        player = this.awardPoints(player, this.POINTS.ATTENDANCE_STREAK_3, '3-day attendance streak!');
      } else if (player.rewards.currentStreak === 5) {
        player = this.awardPoints(player, this.POINTS.ATTENDANCE_STREAK_5, '5-day attendance streak!');
      }
    } else {
      player = this.updateStreak(player);
      if (normalizedAbsenceReason === 'other') {
        player = this.awardPoints(player, this.POINTS.ATTENDANCE_ABSENT_OTHER, 'Absent (other)', { date: dateKey, sessionType });
      }
    }

    return player;
  },

  // Remove a specific attendance record
  removeAttendanceRecord(player, dateKey, sessionType) {
    player = this.initializePlayerRewards(player);
    
    const initialLength = player.rewards.attendanceHistory.length;
    
    // Filter out the specific session
    player.rewards.attendanceHistory = player.rewards.attendanceHistory.filter(r => {
      const rDate = String(r.date || '').split('T')[0];
      const rType = r.sessionType || 'training';
      return !(rDate === dateKey && rType === sessionType);
    });

    // If we removed something, re-calculate the streak
    if (player.rewards.attendanceHistory.length < initialLength) {
      player = this.updateStreak(player);
    }

    return player;
  },

  // Update attendance streak
  updateStreak(player) {
    player = this.initializePlayerRewards(player);

    const history = [...player.rewards.attendanceHistory];
    if (history.length === 0) {
      player.rewards.currentStreak = 0;
      return player;
    }

    // Sort newest -> oldest
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // If latest record is absent, streak is broken
    if (history[0].present !== true) {
      player.rewards.currentStreak = 0;
      return player;
    }

    let streak = 1;
    let lastPresentDate = new Date(history[0].date);

    for (let i = 1; i < history.length; i++) {
      const rec = history[i];
      if (rec.present !== true) break; // Stop at first absence

      const currentDate = new Date(rec.date);
      const diffDays = Math.floor((lastPresentDate - currentDate) / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) { // Allow weekends/gap days
        streak++;
        lastPresentDate = currentDate;
      } else {
        break;
      }
    }

    player.rewards.currentStreak = streak;
    player.rewards.longestStreak = Math.max(player.rewards.longestStreak || 0, streak);
    return player;
  },

  // Award points for performance improvements
  awardPerformancePoints(player, improvementRate) {
    player = this.initializePlayerRewards(player);
    if (improvementRate >= 20) player = this.awardPoints(player, this.POINTS.IMPROVEMENT_LARGE, `${improvementRate.toFixed(1)}% improvement!`);
    else if (improvementRate >= 10) player = this.awardPoints(player, this.POINTS.IMPROVEMENT_MEDIUM, `${improvementRate.toFixed(1)}% improvement!`);
    else if (improvementRate >= 5) player = this.awardPoints(player, this.POINTS.IMPROVEMENT_SMALL, `${improvementRate.toFixed(1)}% improvement!`);
    return player;
  },

  // Check performance improvement
  checkPerformanceImprovement(player) {
    player = this.initializePlayerRewards(player);
    const improvementRate = this.calculateImprovementRate(player);
    player = this.awardPerformancePoints(player, improvementRate);
    this.checkAndAwardBadges(player);
    return player;
  }, 

  // Check and award badges
  checkAndAwardBadges(player) {
    player = this.initializePlayerRewards(player);
    const newBadges = [];

    Object.values(this.BADGES).forEach(badge => {
      if (player.rewards.earnedBadges.some(b => b.id === badge.id)) return;
      if (this.checkBadgeRequirement(player, badge.requirement)) {
        player.rewards.earnedBadges.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          earnedAt: new Date().toISOString()
        });
        newBadges.push(badge);
      }
    });

    return { player, newBadges };
  },

  // Check if badge requirement is met
  checkBadgeRequirement(player, requirement) {
    const rewards = player.rewards;

    switch (requirement.type) {
      case 'videos_watched': return rewards.videoWatchHistory.length >= requirement.count;
      // FIXED: Uses .present instead of .status === 'present'
      case 'attendance_count': return rewards.attendanceHistory.filter(a => a.present === true).length >= requirement.count;
      case 'streak': return rewards.currentStreak >= requirement.count || (rewards.longestStreak || 0) >= requirement.count;
      case 'perfect_month': return this.hasPerfectMonth(player);
      case 'any_improvement': return this.hasAnyImprovement(player);
      case 'improvement_rate': return this.calculateImprovementRate(player) >= requirement.percent;
      case 'average_rating': return this.calculateAverageRating(player) >= requirement.rating;
      case 'category_mastery': return this.hasCategoryMastery(player, requirement.category, requirement.rating);
      case 'total_points': return rewards.totalPoints >= requirement.count;
      default: return false;
    }
  },

  hasPerfectMonth(player) {
    // FIXED: Uses .present
    const recentAttendance = player.rewards.attendanceHistory.slice(-20);
    return recentAttendance.length >= 20 && recentAttendance.every(a => a.present === true);
  },

  hasAnyImprovement(player) {
    if (!player.metrics) return false;
    for (const category of Object.values(player.metrics)) {
      for (const metric of Object.values(category)) {
        if (metric.ratingHistory && metric.ratingHistory.length >= 2) {
          if (metric.ratingHistory[metric.ratingHistory.length - 1].level > metric.ratingHistory[0].level) return true;
        }
      }
    }
    return false;
  },

  calculateImprovementRate(player) {
    if (!player.metrics) return 0;
    let totalImprovement = 0;
    let count = 0;
    for (const category of Object.values(player.metrics)) {
      for (const metric of Object.values(category)) {
        if (metric.ratingHistory && metric.ratingHistory.length >= 2) {
          const first = metric.ratingHistory[0].level;
          const last = metric.ratingHistory[metric.ratingHistory.length - 1].level;
          if (first > 0) {
            totalImprovement += ((last - first) / first) * 100;
            count++;
          }
        }
      }
    }
    return count > 0 ? totalImprovement / count : 0;
  },

  calculateAverageRating(player) {
    if (!player.metrics) return 0;
    let total = 0;
    let count = 0;
    for (const category of Object.values(player.metrics)) {
      for (const metric of Object.values(category)) {
        if (metric.level > 0) {
          total += metric.level;
          count++;
        }
      }
    }
    return count > 0 ? total / count : 0;
  },

  hasCategoryMastery(player, categoryName, minRating) {
    if (!player.metrics || !player.metrics[categoryName]) return false;
    const metrics = Object.values(player.metrics[categoryName]);
    if (metrics.length === 0) return false;
    return metrics.every(m => m.level >= minRating);
  },

  getRewardsSummary(player) {
    player = this.initializePlayerRewards(player);
    return {
      totalPoints: player.rewards.totalPoints,
      badgeCount: player.rewards.earnedBadges.length,
      videosWatched: player.rewards.videoWatchHistory.length,
      // FIXED: Uses .present
      attendanceCount: player.rewards.attendanceHistory.filter(a => a.present === true).length,
      currentStreak: player.rewards.currentStreak,
      longestStreak: player.rewards.longestStreak || 0,
      recentBadges: player.rewards.earnedBadges.slice(-5),
      nextMilestone: this.getNextMilestone(player)
    };
  },

  getNextMilestone(player) {
    const unearned = Object.values(this.BADGES).filter(b => !player.rewards.earnedBadges.some(eb => eb.id === b.id));
    let closest = null;
    let closestDistance = Infinity;

    unearned.forEach(badge => {
      const progress = this.getBadgeProgress(player, badge);
      const distance = 100 - progress;
      if (distance < closestDistance && distance > 0) {
        closestDistance = distance;
        closest = { ...badge, progress };
      }
    });
    return closest;
  },

  getBadgeProgress(player, badge) {
    const req = badge.requirement;
    const rewards = player.rewards;

    switch (req.type) {
      case 'videos_watched': return Math.min(100, (rewards.videoWatchHistory.length / req.count) * 100);
      case 'attendance_count': 
        // FIXED: Uses .present
        const presentCount = rewards.attendanceHistory.filter(a => a.present === true).length;
        return Math.min(100, (presentCount / req.count) * 100);
      case 'total_points': return Math.min(100, (rewards.totalPoints / req.count) * 100);
      case 'improvement_rate': return Math.min(100, (this.calculateImprovementRate(player) / req.percent) * 100);
      case 'average_rating': return Math.min(100, (this.calculateAverageRating(player) / req.rating) * 100);
      default: return 0;
    }
  }
};

// Coach Rewards Settings
const CoachRewardsSettings = {
  DEFAULT_SETTINGS: {
    rewardsEnabled: false,
    customRewards: [
      { id: 1, name: 'Extra water break', pointCost: 50, description: 'Get an extra water break during practice' },
      { id: 2, name: 'Choose warm-up drill', pointCost: 75, description: 'Pick the warm-up drill for practice' },
      { id: 3, name: 'Captain for a day', pointCost: 150, description: 'Be team captain for one game' },
      { id: 4, name: 'Jersey choice', pointCost: 200, description: 'Choose your preferred jersey number' },
      { id: 5, name: 'MVP parking spot', pointCost: 300, description: 'Reserved parking spot for a week' }
    ],
    badgesAlwaysEnabled: true
  },
  async getSettings() {
    try {
      const settings = localStorage.getItem('coachRewardsSettings');
      return settings ? JSON.parse(settings) : this.DEFAULT_SETTINGS;
    } catch (err) { return this.DEFAULT_SETTINGS; }
  },
  async saveSettings(settings) {
    try { localStorage.setItem('coachRewardsSettings', JSON.stringify(settings)); return true; } catch (err) { return false; }
  },
  async addCustomReward(rewardData) {
    const settings = await this.getSettings();
    const newReward = { id: Date.now(), ...rewardData, createdAt: new Date().toISOString() };
    settings.customRewards.push(newReward);
    await this.saveSettings(settings);
    return newReward;
  },
  async removeCustomReward(rewardId) {
    const settings = await this.getSettings();
    settings.customRewards = settings.customRewards.filter(r => r.id !== rewardId);
    await this.saveSettings(settings);
    return true;
  },
  
  async toggleRewards(enabled) {
    const settings = await this.getSettings();
    settings.rewardsEnabled = enabled;
    await this.saveSettings(settings);
    return settings;
  }
};

if (typeof window !== 'undefined') {
  window.Rewards = Rewards;
  window.CoachRewardsSettings = CoachRewardsSettings;
}
