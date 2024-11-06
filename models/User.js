const mongoose = require('mongoose');
const Task = require('./Task');

// Define StakeSchema first since it's referenced in UserSchema
const StakeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'unstaked'],
    default: 'active'
  },
  appliedPromoCodes: [{
    type: String
  }],
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  telegramUserId: {
    type: String,
    required: true,
    unique: true,
  },
  hasClaimedReferralBonus: {
    type: Boolean,
    default: false
  },
  referralBonusesClaimed: {
    type: Number,
    default: 0
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
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
  stakes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stake',
  }],
  lastActive: {
    type: Date,
    default: Date.now,
  },
  usedPromoCodes: [{
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  newReferralBonusClaimed: {
    type: Boolean,
    default: false
  },
  newReferralCount: {
    type: Number,
    default: 0
  },
  newReferralsTracking: [{
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Static method to find user by telegramUserId
UserSchema.statics.findByTelegramUserId = function(telegramUserId) {
  return this.findOne({ telegramUserId: telegramUserId });
};

// Earning methods
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
  let baseEarnings = 10800 * hoursSinceStart;

  switch (this.role) {
    case 'MonthlyBooster':
    case 'LifeTimeBooster':
      return Math.floor(baseEarnings);
    case 'Monthly3xBooster':
      return Math.floor(baseEarnings * 3);
    case 'LifeTime6xBooster':
      return Math.floor(baseEarnings * 6);
    case 'User':
      return Math.min(Math.floor(baseEarnings), 3600);
    default:
      return 0;
  }
};

// Staking methods
UserSchema.methods.stake = async function(amount, period) {
  if (this.balance < amount) {
    throw new Error('Insufficient balance for staking');
  }

  let interestRate;
  switch (period) {
    case 3:
      interestRate = 0.03;
      break;
    case 15:
      interestRate = 0.10;
      break;
    case 45:
      interestRate = 0.35;
      break;
    default:
      throw new Error('Invalid staking period');
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + period * 24 * 60 * 60 * 1000);

  const Stake = mongoose.model('Stake');
  const stake = new Stake({
    user: this._id,
    amount,
    period,
    interestRate,
    startDate,
    endDate,
    status: 'active'
  });

  await stake.save();
  
  this.stakes.push(stake._id);
  this.balance -= amount;
  await this.save();

  return stake;
};

UserSchema.methods.claimStake = async function(stakeId) {
  const Stake = mongoose.model('Stake');
  const stake = await Stake.findById(stakeId);
  
  if (!stake || !this.stakes.includes(stakeId)) {
    throw new Error('Stake not found or does not belong to this user');
  }

  if (stake.status !== 'active') {
    throw new Error('Stake is not active');
  }

  if (new Date() < stake.endDate) {
    throw new Error('Staking period has not ended yet');
  }

  const interest = stake.amount * stake.interestRate;
  const totalAmount = stake.amount + interest;

  this.balance += totalAmount;
  stake.status = 'claimed';

  this.stakes = this.stakes.filter(id => id.toString() !== stakeId.toString());

  await stake.save();
  await this.save();

  return { principal: stake.amount, interest, totalAmount };
};

UserSchema.methods.unstake = async function(stakeId) {
  const Stake = mongoose.model('Stake');
  const stake = await Stake.findById(stakeId);
  
  if (!stake || !this.stakes.includes(stakeId)) {
    throw new Error('Stake not found or does not belong to this user');
  }

  if (stake.status !== 'active') {
    throw new Error('Stake is not active');
  }

  let principal = stake.amount;
  let interest = 0;

  if (new Date() >= stake.endDate) {
    interest = stake.amount * stake.interestRate;
  }

  const totalAmount = principal + interest;

  this.balance += totalAmount;
  stake.status = 'unstaked';

  this.stakes = this.stakes.filter(id => id.toString() !== stakeId.toString());

  await stake.save();
  await this.save();

  return { principal, interest, totalAmount };
};

UserSchema.methods.getActiveStakes = async function() {
  const Stake = mongoose.model('Stake');
  return Stake.find({
    _id: { $in: this.stakes },
    status: 'active'
  });
};

UserSchema.methods.getClaimableStakes = async function() {
  const Stake = mongoose.model('Stake');
  return Stake.find({
    _id: { $in: this.stakes },
    status: 'active',
    endDate: { $lte: new Date() }
  });
};

// Standard user methods
UserSchema.methods.claim = function() {
  const earnings = this.calculateEarnings();
  if (earnings > 0) {
    this.addEarnings(earnings);
    this.lastClaimTime = new Date();
    this.stopEarning();
    this.lastStartTime = null;
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
    this.stopEarning();
  }
};

UserSchema.methods.canStartEarning = function() {
  return !this.isEarning;
};

UserSchema.methods.canClaimReferralBonus = function() {
  const referralsNeededForNextBonus = (this.referralBonusesClaimed + 1) * 10;
  return this.referrals.length >= referralsNeededForNextBonus;
};

// Wallet methods
UserSchema.methods.setWalletAddress = function(address) {
  this.walletAddress = address;
  return this.save();
};

UserSchema.methods.getWalletAddress = function() {
  return this.walletAddress;
};

// New referral system methods
UserSchema.methods.addNewReferral = async function(newUser) {
  this.newReferralsTracking.push({
    referral: newUser._id,
    joinedAt: new Date()
  });
  this.newReferralCount += 1;
  await this.save();
};

// Promo code methods
UserSchema.methods.applyPromoCode = async function(promoCode) {
  const allTasks = await Task.find({ isActive: true });
  const completedTasksCount = this.tasksCompleted.length;

  if (completedTasksCount < allTasks.length) {
    throw new Error('You must complete all available tasks before using a promo code');
  }

  const PromoCode = mongoose.model('PromoCode');
  const promoCodeDoc = await PromoCode.findOne({ code: promoCode, isActive: true });

  if (!promoCodeDoc) {
    throw new Error('Invalid or inactive promo code');
  }

  if (promoCodeDoc.expirationDate && promoCodeDoc.expirationDate < new Date()) {
    throw new Error('Promo code has expired');
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUse = this.usedPromoCodes.find(usage => 
    usage.promoCode.equals(promoCodeDoc._id) && usage.usedAt > twentyFourHoursAgo
  );

  if (recentUse) {
    const timeLeft = new Date(recentUse.usedAt.getTime() + 24 * 60 * 60 * 1000) - new Date();
    const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
    throw new Error(`You can use this promo code again in ${hoursLeft} hours`);
  }

  this.balance += promoCodeDoc.pointsBoost;
  this.usedPromoCodes.push({
    promoCode: promoCodeDoc._id,
    usedAt: new Date()
  });

  await this.save();

  return promoCodeDoc.pointsBoost;
};

const User = mongoose.model('User', UserSchema);
const Stake = mongoose.model('Stake', StakeSchema);

module.exports = { User, Stake };