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
    const leaderboard = await Leaderboard.find(query)
      .sort({ score: -1 })
      .limit(10)
      .populate('userId', 'username role');
    res.json(leaderboard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserRank = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rank = await Leaderboard.countDocuments({ score: { $gt: user.score } }) + 1;

    res.json({ username, rank, score: user.score });
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

    // Allow first-time claim without waiting
    if (!user.lastClaimTime || user.canClaim()) {
      const claimedAmount = user.claim();
      await user.save();

      return res.json({
        message: 'Points claimed successfully',
        claimedAmount,
        newBalance: user.balance,
        claimStreak: user.claimStreak
      });
    }

    // Calculate the time until the next claim
    const minutesToNextClaim = 60 - ((Date.now() - user.lastClaimTime) / (1000 * 60));
    return res.status(400).json({ 
      message: 'You can\'t claim yet', 
      minutesToNextClaim: Math.ceil(minutesToNextClaim),
      secondsToNextClaim: Math.ceil((minutesToNextClaim * 60))  // Show seconds as well
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

