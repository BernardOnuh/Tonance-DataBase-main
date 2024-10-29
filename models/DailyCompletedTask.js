const mongoose = require('mongoose');

const DailyCompletedTaskSchema = new mongoose.Schema({
  userId: {
    type: String,  // Store as string for Telegram IDs
    required: true,
    index: true
  },
  dailyTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
    required: true
  },
  streakDay: {
    type: Number,
    required: true,
    min: 1
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Add compound index for better query performance
DailyCompletedTaskSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.models.DailyCompletedTask || 
  mongoose.model('DailyCompletedTask', DailyCompletedTaskSchema);