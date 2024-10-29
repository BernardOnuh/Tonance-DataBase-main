const mongoose = require('mongoose');

const DailyCompletedTaskSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed from ObjectId to String
    required: true,
    index: true
  },
  dailyTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  streakDay: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for performance
DailyCompletedTaskSchema.index({ userId: 1, completedAt: -1 });

// Safe model registration
module.exports = mongoose.models.DailyCompletedTask || mongoose.model('DailyCompletedTask', DailyCompletedTaskSchema);