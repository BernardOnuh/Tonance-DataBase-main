// controllers/userController.js
const User = require('../models/User');
const crypto = require('crypto');

exports.registerUser = async (req, res) => {
  try {
    const { telegramUserId, username, referralCode } = req.body;
    let referredBy;
    if (referralCode) {
      referredBy = await User.findOne({ referralCode });
      if (!referredBy) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }
    const newReferralCode = crypto.randomBytes(6).toString('hex');
    const user = new User({ 
      telegramUserId, 
      username, 
      referralCode: newReferralCode,
      referredBy: referredBy ? referredBy._id : null
    });
    await user.save();

    if (referredBy) {
      referredBy.referrals.push(user._id);
      await referredBy.save();
      // Add referral points logic here
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('referrals', 'username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.referrals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    const { telegramUserId } = req.params; // Assuming you're fetching details by telegramUserId
    const user = await User.findOne({ telegramUserId }).populate('referrals', 'username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentTime = Date.now();
    const timeSinceLastClaim = currentTime - user.lastClaimTime;
    const claimCooldown = 60 * 60 * 1000; // 1 hour cooldown in milliseconds
    let secondsUntilNextClaim = Math.max((claimCooldown - timeSinceLastClaim) / 1000, 0);

    res.json({
      telegramUserId: user.telegramUserId,
      username: user.username,
      balance: user.balance,
      claimStreak: user.claimStreak,
      lastClaimTime: user.lastClaimTime,
      secondsUntilNextClaim: Math.ceil(secondsUntilNextClaim), // Round up to nearest second
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referrals: user.referrals.map(ref => ref.username),
      // Include any other fields you need here
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
