const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed from ObjectId to String to handle numeric IDs
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
});

module.exports = mongoose.model('Streak', StreakSchema);