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

