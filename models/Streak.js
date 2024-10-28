// models/Streak.js
const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
});

module.exports = mongoose.model('Streak', StreakSchema);
