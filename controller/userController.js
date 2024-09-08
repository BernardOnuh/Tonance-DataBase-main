const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Task = require('../models/Task');

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

// Get user details
exports.getUserDetails = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const user = await User.findOne({ telegramUserId }).populate('referrals', 'username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.checkAndUpdateRole();

    const currentEarnings = user.isEarning ? user.calculateEarnings() : 0;

    res.json({
      telegramUserId: user.telegramUserId,
      username: user.username,
      role: user.role,
      balance: user.balance,
      currentEarnings,
      isEarning: user.isEarning,
      lastStartTime: user.lastStartTime,
      lastClaimTime: user.lastClaimTime,
      roleExpiryDate: user.roleExpiryDate,
      referralCode: user.username, // Assuming username is used as referral code
      referredBy: user.referredBy,
      referrals: user.referrals.map(ref => ref.username),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.playGame = async (req, res) => {
  try {
    const { username, score } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's game score
    user.updateGameScore(score);

    // Save the updated user document
    await user.save();

    res.status(200).json({ 
      message: 'Game score updated successfully', 
      newHighScore: user.gameScore === score,
      currentScore: score,
      highScore: user.gameScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.completeTask = async (req, res) => {
  try {
    const { username, taskId } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the task by taskId
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task is already completed by the user
    if (user.tasksCompleted.includes(taskId)) {
      return res.status(400).json({ message: 'Task already completed' });
    }

    // Add the task to the user's completed tasks
    user.tasksCompleted.push(taskId);

    // Optional: If you have a `tasks` array, remove the task from pending tasks
    // (If `tasks` field is meant to track pending tasks, initialize it if necessary)
    if (user.tasks) {
      user.tasks = user.tasks.filter(t => t.toString() !== taskId);
    }

    // Reward the user for completing the task
    user.addEarnings(task.points);

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'Task completed successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompletedTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    let user;

    // Check if userId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).populate('tasksCompleted');
    } else {
      // If not a valid ObjectId, try to find the user by telegramUserId
      user = await User.findOne({ telegramUserId: userId }).populate('tasksCompleted');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.tasksCompleted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Start earning points
exports.startEarning = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const user = await User.findOne({ telegramUserId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEarning) {
      return res.status(400).json({ message: 'User is already earning points' });
    }

    user.startEarning();
    await user.save();

    res.status(200).json({ message: 'Started earning points', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Claim points
exports.claimPoints = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const user = await User.findOne({ telegramUserId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.checkAndUpdateRole();

    const claimedAmount = user.claim();
    
    if (claimedAmount > 0) {
      await user.save();
      
      // Automatically start earning again after claiming
      user.startEarning();
      await user.save();

      res.status(200).json({ 
        message: 'Points claimed successfully', 
        claimedAmount, 
        newBalance: user.balance,
        isEarning: user.isEarning
      });
    } else {
      res.status(400).json({ message: 'No points available to claim' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Set user role
exports.setUserRole = async (req, res) => {
  try {
    const { telegramUserId } = req.params;
    const { role, durationInDays } = req.body;
    const user = await User.findOne({ telegramUserId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.setRole(role, durationInDays);
    await user.save();

    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};