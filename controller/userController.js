const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { telegramUserId, username, referralCode } = req.body;
    let referredBy = null;

    if (referralCode) {
      referredBy = await User.findOne({ username: referralCode });
      if (!referredBy) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    const user = new User({
      telegramUserId,
      username,
      referredBy: referredBy ? referredBy._id : null,
    });
    await user.save();

    if (referredBy) {
      referredBy.referrals.push(user._id);
      referredBy.addEarnings(15000);
      await referredBy.save();

      const referralBonuses = [0.20, 0.10, 0.05, 0.025, 0.0125];
      let currentReferrer = referredBy;

      for (let i = 0; i < referralBonuses.length; i++) {
        if (currentReferrer) {
          const bonusAmount = 30000 * referralBonuses[i];
          currentReferrer.addEarnings(bonusAmount);
          await currentReferrer.save();

          currentReferrer = await User.findById(currentReferrer.referredBy);
        } else {
          break;
        }
      }
    }

    user.addEarnings(30000);
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all referrals for a user
exports.getUserReferrals = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const objectId = new ObjectId(userId);

    const user = await User.findById(objectId).populate('referrals', 'username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.referrals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user details by Telegram user ID
exports.getUserDetails = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
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
      secondsUntilNextClaim: Math.ceil(secondsUntilNextClaim),
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      referrals: user.referrals.map(ref => ref.username),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark a task as completed for a user
exports.completeTask = async (req, res) => {
  try {
    const { username, taskId } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.tasksCompleted.includes(taskId)) {
      return res.status(400).json({ message: 'Task already completed' });
    }

    user.tasksCompleted.push(taskId);
    await user.save();

    res.json({ message: 'Task marked as completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
