const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed to String to handle numeric user IDs
    required: true,
    index: true // Add index for better query performance
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0 // Ensure streak can't be negative
  },
  lastCheckIn: {
    type: Date,
    default: null
  },
  highestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCheckIns: {
    type: Number,
    default: 0,
    min: 0
  },
  streakStartDate: {
    type: Date,
    default: null
  },
  lastMissedDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for efficient queries
StreakSchema.index({ userId: 1, lastCheckIn: -1 });

// Method to check if streak is still active
StreakSchema.methods.isStreakActive = function() {
  if (!this.lastCheckIn) return false;
  
  const now = new Date();
  const lastCheckIn = new Date(this.lastCheckIn);
  const timeDiff = now - lastCheckIn;
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  return daysDiff <= 1; // Streak is active if last check-in was within 24 hours
};

// Method to update streak
StreakSchema.methods.updateStreak = function() {
  const now = new Date();
  
  if (!this.lastCheckIn) {
    // First check-in
    this.currentStreak = 1;
    this.streakStartDate = now;
  } else {
    const lastCheckIn = new Date(this.lastCheckIn);
    const timeDiff = now - lastCheckIn;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      // Consecutive day check-in
      this.currentStreak += 1;
    } else {
      // Streak broken
      this.lastMissedDate = lastCheckIn;
      this.currentStreak = 1;
      this.streakStartDate = now;
    }
  }

  // Update highest streak if current streak is higher
  if (this.currentStreak > this.highestStreak) {
    this.highestStreak = this.currentStreak;
  }

  this.totalCheckIns += 1;
  this.lastCheckIn = now;
};

// Static method to get user streak status
StreakSchema.statics.getUserStreakStatus = async function(userId) {
  const streak = await this.findOne({ userId });
  if (!streak) return null;

  return {
    userId: streak.userId,
    currentStreak: streak.currentStreak,
    highestStreak: streak.highestStreak,
    totalCheckIns: streak.totalCheckIns,
    lastCheckIn: streak.lastCheckIn,
    streakStartDate: streak.streakStartDate,
    isActive: streak.isStreakActive(),
    lastMissedDate: streak.lastMissedDate
  };
};

// Pre-save middleware to validate userId
StreakSchema.pre('save', function(next) {
  // Ensure userId is a positive number
  if (isNaN(this.userId) || parseInt(this.userId) <= 0) {
    next(new Error('userId must be a positive number'));
  } else {
    this.userId = this.userId.toString(); // Ensure userId is stored as string
    next();
  }
});

// Create compound index for user's streak history
StreakSchema.index({ 
  userId: 1, 
  currentStreak: -1, 
  lastCheckIn: -1 
});

const Streak = mongoose.model('Streak', StreakSchema);

// Create indexes
Streak.createIndexes().catch(err => {
  console.error('Error creating indexes for Streak model:', err);
});

module.exports = Streak;