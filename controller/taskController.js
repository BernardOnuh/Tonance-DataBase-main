const Task = require('../models/Task');
const User = require('../models/User');

// Get all tasks for a specific user (excluding completed ones)
exports.getTasksForUser = async (req, res) => {
  try {
    const { username } = req.params;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find tasks that are active and not completed by the user
    const tasks = await Task.find({
      isActive: true,
      _id: { $nin: user.tasksCompleted }, // Exclude tasks that are completed by the user
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { topic, description, imageUrl, points, expiresAt, completionDelay } = req.body;

    const newTask = new Task({
      topic,
      description,
      imageUrl,
      points,
      expiresAt,
      completionDelay,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a task by ID
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a task by ID
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
