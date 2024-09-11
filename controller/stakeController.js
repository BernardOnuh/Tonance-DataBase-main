// stakeController.js
const { User, Stake } = require('../models/User');

exports.createStake = async (req, res) => {
  try {
    const { userId, amount, period } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stake = await user.stake(amount, period);
    res.status(201).json({ message: 'Stake created successfully', stake });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.claimStake = async (req, res) => {
  try {
    const { userId, stakeId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const claimedAmount = await user.claimStake(stakeId);
    res.status(200).json({ message: 'Stake claimed successfully', claimedAmount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getActiveStakes = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeStakes = await user.getActiveStakes();
    res.status(200).json(activeStakes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getClaimableStakes = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const claimableStakes = await user.getClaimableStakes();
    res.status(200).json(claimableStakes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
