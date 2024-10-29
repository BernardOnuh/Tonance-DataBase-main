const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const DailyTaskService = require('../services/DailyTaskService'); // Add this import

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
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({ error: 'Invalid taskId format' });
      }

      const task = await DailyTaskService.updateDailyTask(
        new ObjectId(req.params.taskId), 
        req.body
      );
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteDailyTask(req, res) {
    try {
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({ error: 'Invalid taskId format' });
      }

      const result = await DailyTaskService.deleteDailyTask(
        new ObjectId(req.params.taskId)
      );
      
      if (!result) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ message: 'Task deleted successfully' });
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

      const task = await DailyTaskService.getDailyTaskById(
        new ObjectId(req.params.taskId)
      );
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async completeDaily(req, res) {
    try {
      const { userId, taskId } = req.params;

      // Validate taskId as ObjectId
      if (!ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: 'Invalid taskId format' });
      }

      // Validate Telegram userId format (9-10 digits)
      if (!userId || !/^\d{9,10}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid Telegram userId format. Expected 9-10 digit Telegram ID' });
      }

      const result = await DailyTaskService.completeDaily(
        userId,
        new ObjectId(taskId)
      );
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCompletionHistory(req, res) {
    try {
      const { userId } = req.params;

      // Validate Telegram userId format
      if (!userId || !/^\d{9,10}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid Telegram userId format. Expected 9-10 digit Telegram ID' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const history = await DailyTaskService.getCompletionHistory(
        userId,
        page,
        limit
      );
      
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStreakStatus(req, res) {
    try {
      const { userId } = req.params;

      // Validate Telegram userId format
      if (!userId || !/^\d{9,10}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid Telegram userId format. Expected 9-10 digit Telegram ID' });
      }

      const status = await DailyTaskService.getStreakStatus(userId);
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserDailyTasks(req, res) {
    try {
      const { userId } = req.params;

      // Validate Telegram userId format
      if (!userId || !/^\d{9,10}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid Telegram userId format. Expected 9-10 digit Telegram ID' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const tasks = await DailyTaskService.getUserDailyTasks(
        userId,
        page,
        limit
      );
      
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTaskStats(req, res) {
    try {
      const { userId } = req.params;

      // Validate Telegram userId format
      if (!userId || !/^\d{9,10}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid Telegram userId format. Expected 9-10 digit Telegram ID' });
      }

      const stats = await DailyTaskService.getTaskStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = DailyTaskController;