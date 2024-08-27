// controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const CompletedTask = require('../models/CompletedTask');
const Leaderboard = require('../models/Leaderboard');

exports.createTask = async (req, res) => {
  try {
    const { topic, description, imageUrl, points } = req.body;
    const task = new Task({ topic, description, imageUrl, points });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true });
    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    const user = await User.findById(userId);
    const task = await Task.findById(taskId);

    if (!user || !task) {
      return res.status(404).json({ message: 'User or Task not found' });
    }

    const completedTask = new CompletedTask({ userId, taskId });
    await completedTask.save();

    user.balance += task.points;
    await user.save();

    await Leaderboard.findOneAndUpdate(
      { userId: user._id },
      { $inc: { score: task.points }, role: user.role },
      { upsert: true, new: true }
    );

    res.json({ message: 'Task completed successfully', newBalance: user.balance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};