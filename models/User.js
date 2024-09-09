const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramUserId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['User', 'MonthlyBooster', 'LifeTimeBooster', 'Monthly3xBooster', 'LifeTime6xBooster'],
    default: 'User',
  },
  balance: {
    type: Number,
    default: 0,
  },
  lastClaimTime: {
    type: Date,
    default: null,
  },
  lastStartTime: {
    type: Date,
    default: null,
  },
  roleExpiryDate: {
    type: Date,
    default: null,
  },
  isEarning: {
    type: Boolean,
    default: false,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  joinBonus: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  gameScore: {
    type: Number,
    default: 0,
  },
  tasksCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

UserSchema.methods.startEarning = function() {
  if (!this.isEarning) {
    this.isEarning = true;
    this.lastStartTime = new Date();
    return true;
  }
  return false;
};

UserSchema.methods.stopEarning = function() {
  if (this.isEarning) {
    this.isEarning = false;
    return true;
  }
  return false;
};

UserSchema.methods.calculateEarnings = function() {
  if (!this.lastStartTime) {
    return 0;
  }

  const now = new Date();
  const hoursSinceStart = (now - this.lastStartTime) / (1000 * 60 * 60);
  let baseEarnings = 3600 * Math.floor(hoursSinceStart); // Only count full hours

  switch (this.role) {
    case 'MonthlyBooster':
    case 'LifeTimeBooster':
      return baseEarnings;
    case 'Monthly3xBooster':
      return baseEarnings * 3;
    case 'LifeTime6xBooster':
      return baseEarnings * 6;
    case 'User':
      return Math.min(baseEarnings, 3600); // Cap at 3600 for User role
    default:
      return 0;
  }
};

UserSchema.methods.claim = function() {
  const earnings = this.calculateEarnings();
  if (earnings > 0) {
    this.addEarnings(earnings);
    this.lastClaimTime = new Date();
    if (this.role === 'User') {
      this.stopEarning(); // Stop earning only for User role
    } else {
      this.lastStartTime = new Date(); // Reset start time for other roles
    }
    return earnings;
  }
  return 0;
};

UserSchema.methods.addEarnings = function(amount) {
  this.balance += amount;
  this.totalEarnings += amount;
};

UserSchema.methods.setRole = function(role, durationInDays = null) {
  this.role = role;
  if (durationInDays) {
    this.roleExpiryDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
  } else if (role.includes('LifeTime')) {
    this.roleExpiryDate = null;
  }
  if (role !== 'User') {
    this.startEarning(); // Automatically start earning for non-User role
  }
};

UserSchema.methods.checkAndUpdateRole = function() {
  if (this.roleExpiryDate && this.roleExpiryDate <= new Date()) {
    this.role = 'User';
    this.roleExpiryDate = null;
    this.stopEarning(); // Stop earning when role changes to User
  }
};

UserSchema.methods.canStartEarning = function() {
  if (this.role === 'User') {
    // For User role, check if it's been at least 1 hour since last cl
  }
  // For other roles, they are always earning
  return false;
};

module.exports = mongoose.model('User', UserSchema);
