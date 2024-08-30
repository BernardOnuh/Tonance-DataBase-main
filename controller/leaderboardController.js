// controllers/leaderboardController.js
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }

    // Fetch users sorted by the number of referrals (in descending order)
    const users = await User.find(query)
      .populate('referrals', 'username')
      .sort({ 'referrals.length': -1 }) // Sort by the number of referrals
      .select('username role referrals');

    // Initialize arrays to hold classified users
    const promoters = [];
    const influencers = [];
    const ambassadors = [];

    // Rank users and classify them based on rank
    users.forEach((user, index) => {
      const rank = index + 1;
      const referralCount = user.referrals.length;

      let classification = 'User';

      if (rank <= 5000) {
        classification = 'Promoter';
        promoters.push({
          username: user.username,
          role: classification,
          referralCount: referralCount,
          rank: rank,
        });
      } else if (rank <= 20000) {
        classification = 'Influencer';
        influencers.push({
          username: user.username,
          role: classification,
          referralCount: referralCount,
          rank: rank,
        });
      } else if (rank <= 50000) {
        classification = 'Ambassador';
        ambassadors.push({
          username: user.username,
          role: classification,
          referralCount: referralCount,
          rank: rank,
        });
      }
    });

    // Return the leaderboard with separate classifications
    res.json({
      promoters,
      influencers,
      ambassadors
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getUserRank = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate('referrals', 'username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the rank of the user
    const users = await User.find({})
      .sort({ 'referrals.length': -1 })
      .select('username referrals');

    let rank = 0;
    let classification = 'User';

    // Find the rank of the user
    users.forEach((u, index) => {
      if (u.username === username) {
        rank = index + 1;
      }
    });

    // Determine the classification based on rank
    if (rank <= 5000) {
      classification = 'Promoter';
    } else if (rank <= 20000) {
      classification = 'Influencer';
    } else if (rank <= 50000) {
      classification = 'Ambassador';
    }

    res.json({
      username: user.username,
      referralCount: user.referrals.length,
      rank: rank,
      classification: classification,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.claimHourlyPoints = async (req, res) => {
  try {
    const { telegramUserId } = req.body;
    const user = await User.findOne({ telegramUserId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.canClaim()) {
      const secondsToNextClaim = Math.ceil((60 * 60) - ((Date.now() - user.lastClaimTime) / 1000));
      return res.status(400).json({ 
        message: 'You can\'t claim yet', 
        secondsToNextClaim 
      });
    }

    const claimedAmount = user.claim();
    await user.save();

    res.json({
      message: 'Points claimed successfully',
      claimedAmount,
      newBalance: user.balance,
      claimStreak: user.claimStreak,
      secondsToNextClaim: 3600 // 1 hour until the next claim
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


