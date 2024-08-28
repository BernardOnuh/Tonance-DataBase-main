// controllers/userController.js
const User = require('../models/User');
const ObjectId = mongoose.Types.ObjectId;
const crypto = require('crypto');

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

    // Creating the new user
    const user = new User({
      telegramUserId,
      username,
      referredBy: referredBy ? referredBy._id : null,  // Store the ObjectId reference
    });
    await user.save();

    if (referredBy) {
      // Update the first-level referrer
      referredBy.referrals.push(user._id);  // Store ObjectId in referrals array
      referredBy.addEarnings(15000);  // First level referral bonus
      await referredBy.save();

      // Calculate referral bonuses up to 5 levels
      const referralBonuses = [0.20, 0.10, 0.05, 0.025, 0.0125];
      let currentReferrer = referredBy;

      for (let i = 0; i < referralBonuses.length; i++) {
        if (currentReferrer) {
          const bonusAmount = 30000 * referralBonuses[i];
          currentReferrer.addEarnings(bonusAmount);
          await currentReferrer.save();

          // Move to the next level referrer
          currentReferrer = await User.findById(currentReferrer.referredBy);
        } else {
          break;
        }
      }
    }

    // Adding bonus for the new user
    user.addEarnings(30000);  // New user bonus
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserReferrals = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Ensure the userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Convert the userId string to an ObjectId
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
