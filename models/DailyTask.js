// models/dailyTask.js
const mongoose = require('mongoose');

const DailyTaskSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  dayNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  points: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completionDelay: {
    type: Number,
    required: true,
    default: 0
  },
  link: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', DailyTaskSchema);