const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed from ObjectId to String
    required: true,
    index: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastCheckIn: {
    type: Date,
    default: null
  },
  highestStreak: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for performance
StreakSchema.index({ userId: 1, lastCheckIn: -1 });

module.exports = mongoose.model('Streak', StreakSchema);