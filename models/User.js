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
    enum: ['User', 'Promoter', 'Influencer', 'Ambassador'],
    default: 'User',
  },
  balance: {
    type: Number,
    default: 0,
  },
  lastClaimTime: {
    type: Date,
    default: null,  // Indicates no claim yet
  },
  firstClaim: {
    type: Boolean,
    default: false,  // Track whether the user has made their first claim
  },
  claimStreak: {
    type: Number,
    default: 0,  // Tracks consecutive claims within 25 hours
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to another User document
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Array of references to User documents
  }],
  joinBonus: {
    type: Number,
    default: 0,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  tasksCompleted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',  // Reference to completed tasks
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

// Method to update the user's role based on the number of referrals
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

// Method to add a referral and update the role if necessary
UserSchema.methods.addReferral = function(userId) {
  if (!this.referrals.includes(userId)) {
    this.referrals.push(userId);
    this.updateRole();
  }
};

// Method to add earnings to the user's balance and total earnings
UserSchema.methods.addEarnings = function(amount) {
  this.balance += amount;
  this.totalEarnings += amount;
};

// Method to check if the user can claim a reward
UserSchema.methods.canClaim = function() {
  if (!this.firstClaim) {
    return true;  // Allow the first claim
  }
  const hoursSinceLastClaim = (Date.now() - this.lastClaimTime) / (1000 * 60 * 60);
  return hoursSinceLastClaim >= 1;
};

// Method to claim the reward
UserSchema.methods.claim = function() {
  const now = new Date();
  const hoursSinceLastClaim = (now - this.lastClaimTime) / (1000 * 60 * 60);

  let claimAmount = 3600;  // Base claim amount

  if (this.firstClaim && hoursSinceLastClaim <= 25) {  // Maintain streak if within 25 hours
    this.claimStreak += 1;
    claimAmount += Math.min(this.claimStreak, 10);  // Bonus for streak, max 10 extra points
  } else {
    this.claimStreak = 1;  // Reset streak if more than 25 hours have passed
  }

  this.lastClaimTime = now;
  this.firstClaim = true;  // Set first claim to true after the initial claim
  this.addEarnings(claimAmount);

  return claimAmount;
};

module.exports = mongoose.model('User', UserSchema);
