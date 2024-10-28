// models/dailyCompletedTask.js
const mongoose = require('mongoose');

const DailyCompletedTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dailyTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
    required: true
  },
  streakDay: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DailyCompletedTask', DailyCompletedTaskSchema);