const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: String,  // Store as string for Telegram IDs
    required: true,
    unique: true,
    index: true
  },
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  highestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCheckIn: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Streak || mongoose.model('Streak', StreakSchema);