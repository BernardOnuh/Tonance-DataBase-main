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

// Add a compound index for additional uniqueness constraint
UserSchema.index({ telegramUserId: 1, username: 1 }, { unique: true });

// Pre-save hook to handle potential duplicate key errors
UserSchema.pre('save', async function(next) {
  try {
    const existingUser = await this.constructor.findOne({
      $or: [
        { telegramUserId: this.telegramUserId },
        { username: this.username }
      ]
    });

    if (existingUser) {
      if (existingUser.telegramUserId === this.telegramUserId) {
        throw new Error('A user with this Telegram ID already exists.');
      }
      if (existingUser.username === this.username) {
        throw new Error('This username is already taken.');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

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
  if (!this.lastStartTime || !this.isEarning) {
    return 0;
  }
  
  const now = new Date();
  const hoursSinceStart = (now - this.lastStartTime) / (1000 * 60 * 60);
  let baseEarnings = 3600 * hoursSinceStart; // Calculate earnings based on exact time

  switch (this.role) {
    case 'MonthlyBooster':
    case 'LifeTimeBooster':
      return Math.floor(baseEarnings);
    case 'Monthly3xBooster':
      return Math.floor(baseEarnings * 3);
    case 'LifeTime6xBooster':
      return Math.floor(baseEarnings * 6);
    case 'User':
      return Math.min(Math.floor(baseEarnings), 3600); // Cap at 3600 for User role
    default:
      return 0;
  }
};

UserSchema.methods.claim = function() {
  const earnings = this.calculateEarnings();
  if (earnings > 0) {
    this.addEarnings(earnings);
    this.lastClaimTime = new Date();
    this.stopEarning(); // Stop earning for all roles after claiming
    this.lastStartTime = null; // Reset lastStartTime
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
};

UserSchema.methods.checkAndUpdateRole = function() {
  if (this.roleExpiryDate && this.roleExpiryDate <= new Date()) {
    this.role = 'User';
    this.roleExpiryDate = null;
    this.stopEarning(); // Stop earning when role changes to User
  }
};

UserSchema.methods.canStartEarning = function() {
  // All roles can start earning at any time if they're not already earning
  return !this.isEarning;
};

const User = mongoose.model('User', UserSchema);