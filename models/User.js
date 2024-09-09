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
}, { }, { timestamps: true });

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

module.exports = mongoose.model('User', UserSchema);

// Controller functions
exports.startEarning = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const user = await User.findOne({ telegramUserId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEarning) {
      return res.status(400).json({ message: 'User is already earning points' });
    }
    
    if (!user.canStartEarning()) {
      return res.status(400).json({ message: 'User cannot start earning right now.' });
    }
    
    user.startEarning();
    await user.save();
    
    res.status(200).json({ message: 'Started earning points', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.claimPoints = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const user = await User.findOne({ telegramUserId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.checkAndUpdateRole();
    
    const claimedAmount = user.claim();
    
    if (claimedAmount > 0) {
      await user.save();
      
      res.status(200).json({
        message: 'Points claimed successfully',
        claimedAmount,
        newBalance: user.balance,
        isEarning: user.isEarning
      });
    } else {
      res.status(400).json({ message: 'No points available to claim' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};