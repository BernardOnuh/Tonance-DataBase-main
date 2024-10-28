// utils/streakUtils.js
/**
 * Checks if two dates are on consecutive days
 * @param {Date} date1 First date
 * @param {Date} date2 Second date
 * @returns {boolean}
 */
const areConsecutiveDays = (date1, date2) => {
    if (!date1 || !date2) return false;
    
    const day1 = new Date(date1).setHours(0, 0, 0, 0);
    const day2 = new Date(date2).setHours(0, 0, 0, 0);
    const diffTime = Math.abs(day2 - day1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };
  
  /**
   * Gets points for a specific streak day
   * @param {number} streakDay Current streak day
   * @returns {number} Points for that day
   */
  const getDailyPoints = (streakDay) => {
    const pointsSchedule = [
      5000,      // Day 1
      10000,     // Day 2
      15000,     // Day 3
      20000,     // Day 4
      25000,     // Day 5
      30000,     // Day 6
      40000,     // Day 7
      50000,     // Day 8
      60000,     // Day 9
      70000,     // Day 10
      80000,     // Day 11
      90000,     // Day 12
      100000,    // Day 13
      120000,    // Day 14
      140000,    // Day 15
      160000,    // Day 16
      180000,    // Day 17
      200000,    // Day 18
      220000,    // Day 19
      240000,    // Day 20
      260000,    // Day 21
      300000,    // Day 22
      350000,    // Day 23
      400000,    // Day 24
      450000,    // Day 25
      500000,    // Day 26
      600000,    // Day 27
      700000,    // Day 28
      800000,    // Day 29
      1000000    // Day 30
    ];
  
    // If streakDay is out of bounds, return the first day's points
    return pointsSchedule[streakDay - 1] || pointsSchedule[0];
  };
  
  /**
   * Calculates next milestone for streak
   * @param {number} currentStreak Current streak count
   * @returns {Object} Milestone information
   */
  const getNextMilestone = (currentStreak) => {
    const milestones = [7, 14, 21, 30];
    const nextMilestone = milestones.find(m => m > currentStreak) || milestones[milestones.length - 1];
    return {
      nextMilestone,
      daysUntilMilestone: nextMilestone - currentStreak
    };
  };
  
  /**
   * Checks if a streak qualifies for bonus points
   * @param {number} streakDay Current streak day
   * @returns {Object} Bonus information
   */
  const getStreakBonus = (streakDay) => {
    const bonusSchedule = {
      7: 1.1,    // 10% bonus at 7 days
      14: 1.2,   // 20% bonus at 14 days
      21: 1.3,   // 30% bonus at 21 days
      30: 1.5    // 50% bonus at 30 days
    };
  
    let multiplier = 1;
    let bonusLabel = '';
  
    if (streakDay >= 30) {
      multiplier = bonusSchedule[30];
      bonusLabel = '30-Day Champion';
    } else if (streakDay >= 21) {
      multiplier = bonusSchedule[21];
      bonusLabel = '21-Day Warrior';
    } else if (streakDay >= 14) {
      multiplier = bonusSchedule[14];
      bonusLabel = '14-Day Master';
    } else if (streakDay >= 7) {
      multiplier = bonusSchedule[7];
      bonusLabel = '7-Day Achiever';
    }
  
    return {
      multiplier,
      bonusLabel,
      hasBonus: multiplier > 1
    };
  };
  
  /**
   * Calculate total points including streak bonuses
   * @param {number} basePoints Base points for the day
   * @param {number} streakDay Current streak day
   * @returns {Object} Total points calculation
   */
  const calculateTotalPoints = (basePoints, streakDay) => {
    const { multiplier, bonusLabel, hasBonus } = getStreakBonus(streakDay);
    const totalPoints = Math.floor(basePoints * multiplier);
    const bonusPoints = totalPoints - basePoints;
  
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      multiplier,
      bonusLabel,
      hasBonus
    };
  };
  
  module.exports = {
    areConsecutiveDays,
    getDailyPoints,
    getNextMilestone,
    getStreakBonus,
    calculateTotalPoints
  };