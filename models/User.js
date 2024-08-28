// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramUserId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['User', 'Promoter', 'Influencer', 'Ambassador'],
    default: 'User'
  },
  balance: {
    type: Number,
    default: 0
  },
  lastClaimTime: {
    type: Date,
    default: Date.now
  },
  referredBy: {
    type: String  // Username of the user who referred this user
  },
  referrals: [{
    type: String  // Array of usernames referred by this user
  }],
  joinBonus: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  tasksCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  claimStreak: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Method to update user role based on referral count
UserSchema.methods.updateRole = function() {
  const referralCount = this.referrals.length;
  if (referralCount >= 5001) {
    this.role = 'Ambassador';
  } else if (referralCount >= 1001) {
    this.role = 'Influencer';
  } else if (referralCount >= 1) {
    this.role = 'Promoter';
  } else {
    this.role = 'User';
  }
};

// Method to add a referral and update the user's role
UserSchema.methods.addReferral = function(username) {
  if (!this.referrals.includes(username)) {
    this.referrals.push(username);
    this.updateRole();
  }
};

// Method to add earnings to the user
UserSchema.methods.addEarnings = function(amount) {
  this.balance += amount;
  this.totalEarnings += amount;
};

// Method to check if the user can claim points
UserSchema.methods.canClaim = function() {
  const hoursSinceLastClaim = (Date.now() - this.lastClaimTime) / (1000 * 60 * 60);
  return hoursSinceLastClaim >= 1;
};

// Method to handle the claiming of points by the user
UserSchema.methods.claim = function() {
  const now = new Date();
  const hoursSinceLastClaim = (now - this.lastClaimTime) / (1000 * 60 * 60);

  let claimAmount = 10; // Base claim amount

  if (hoursSinceLastClaim <= 25) { // Within 25 hours to maintain streak
    this.claimStreak += 1;
    claimAmount += Math.min(this.claimStreak, 10); // Bonus for streak, max 10 extra points
  } else {
    this.claimStreak = 1; // Reset streak if more than 25 hours have passed
  }

  this.lastClaimTime = now;
  this.addEarnings(claimAmount);

  return claimAmount;
};

module.exports = mongoose.model('User', UserSchema);
