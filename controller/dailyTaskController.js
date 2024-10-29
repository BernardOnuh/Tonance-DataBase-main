const DailyTaskService = require('../services/dailyTaskService');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

class DailyTaskController {
  static async createDailyTask(req, res) {
    try {
      const task = await DailyTaskService.createDailyTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateDailyTask(req, res) {
    try {
      const task = await DailyTaskService.updateDailyTask(req.params.taskId, req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteDailyTask(req, res) {
    try {
      const result = await DailyTaskService.deleteDailyTask(req.params.taskId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllDailyTasks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const tasks = await DailyTaskService.getAllDailyTasks(page, limit);
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getDailyTaskById(req, res) {
    try {
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({ error: 'Invalid taskId format' });
      }
      const task = await DailyTaskService.getDailyTaskById(req.params.taskId);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async completeDaily(req, res) {
    try {
      const userId = req.params.userId;
      
      // Validate taskId is a valid ObjectId
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({ error: 'Invalid taskId format' });
      }

      // Validate userId is a number
      if (isNaN(userId) || parseInt(userId) <= 0) {
        return res.status(400).json({ error: 'Invalid userId format. Must be a positive number' });
      }

      const result = await DailyTaskService.completeDaily(userId.toString(), req.params.taskId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCompletionHistory(req, res) {
    try {
      const userId = req.params.userId;
      
      // Validate userId is a number
      if (isNaN(userId) || parseInt(userId) <= 0) {
        return res.status(400).json({ error: 'Invalid userId format. Must be a positive number' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const history = await DailyTaskService.getCompletionHistory(userId.toString(), page, limit);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStreakStatus(req, res) {
    try {
      const userId = req.params.userId;
      
      // Validate userId is a number
      if (isNaN(userId) || parseInt(userId) <= 0) {
        return res.status(400).json({ error: 'Invalid userId format. Must be a positive number' });
      }

      const status = await DailyTaskService.getStreakStatus(userId.toString());
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = DailyTaskController;