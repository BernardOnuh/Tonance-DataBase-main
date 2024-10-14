const DailyPoint = require('../models/DailyPoint');
const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

exports.claimDailyPoints = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    
    const user = await User.findOne({ telegramUserId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let dailyPoint = await DailyPoint.findOne({ user: user._id });
    if (!dailyPoint) {
      dailyPoint = new DailyPoint({ user: user._id });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dailyPoint.lastClaimDate && dailyPoint.lastClaimDate.getTime() === today.getTime()) {
      return res.status(400).json({ message: 'Daily points already claimed today' });
    }
    
    if (!dailyPoint.lastClaimDate || dailyPoint.lastClaimDate.getTime() < today.getTime() - 86400000) {
      // Reset streak if it's been more than a day since last claim
      dailyPoint.currentStreak = 0;
      dailyPoint.nextClaimAmount = 1000;
    }
    
    // Check for referral bonus
    let bonusMultiplier = 1;
    if (dailyPoint.dailyReferrals > 2) {
      bonusMultiplier = 2;
    }
    
    // Claim points
    const claimedAmount = dailyPoint.nextClaimAmount * bonusMultiplier;
    user.addEarnings(claimedAmount);
    await user.save();
    
    // Update daily point record
    dailyPoint.currentStreak += 1;
    dailyPoint.lastClaimDate = today;
    dailyPoint.nextClaimAmount = Math.min(dailyPoint.currentStreak * 1000, 30000);
    dailyPoint.dailyReferrals = 0; // Reset daily referrals
    dailyPoint.lastReferralReset = today;
    await dailyPoint.save();
    
    res.status(200).json({
      message: 'Daily points claimed successfully',
      claimedAmount,
      currentStreak: dailyPoint.currentStreak,
      nextClaimAmount: dailyPoint.nextClaimAmount,
      newBalance: user.balance,
      bonusApplied: bonusMultiplier > 1
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
};

exports.getDailyPointStatus = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    
    const user = await User.findOne({ telegramUserId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let dailyPoint = await DailyPoint.findOne({ user: user._id });
    if (!dailyPoint) {
      dailyPoint = new DailyPoint({ user: user._id });
      await dailyPoint.save();
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const canClaimToday = !dailyPoint.lastClaimDate || dailyPoint.lastClaimDate < today;
    
    res.status(200).json({
      currentStreak: dailyPoint.currentStreak,
      nextClaimAmount: dailyPoint.nextClaimAmount,
      lastClaimDate: dailyPoint.lastClaimDate,
      canClaimToday,
      dailyReferrals: dailyPoint.dailyReferrals,
      bonusEligible: dailyPoint.dailyReferrals > 2
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
};

exports.addReferral = async (userId) => {
  try {
    const dailyPoint = await DailyPoint.findOne({ user: userId });
    if (!dailyPoint) {
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dailyPoint.lastReferralReset < today) {
      dailyPoint.dailyReferrals = 1;
      dailyPoint.lastReferralReset = today;
    } else {
      dailyPoint.dailyReferrals += 1;
    }
    
    await dailyPoint.save();
  } catch (error) {
    console.error('Error adding referral:', error);
  }
};