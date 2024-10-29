const mongoose = require('mongoose');

const DailyCompletedTaskSchema = new mongoose.Schema({
  userId: {
    type: String,  // Changed to String to store Discord user IDs
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
}, {
  timestamps: true
});

// Add compound index for better query performance
DailyCompletedTaskSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.models.DailyCompletedTask || 
  mongoose.model('DailyCompletedTask', DailyCompletedTaskSchema);