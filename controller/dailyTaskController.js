// controllers/dailyTaskController.js
const DailyTaskService = require('../services/dailyTaskService');

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
      const task = await DailyTaskService.getDailyTaskById(req.params.taskId);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async completeDaily(req, res) {
    try {
      const result = await DailyTaskService.completeDaily(req.params.userId, req.params.taskId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCompletionHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const history = await DailyTaskService.getCompletionHistory(req.params.userId, page, limit);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStreakStatus(req, res) {
    try {
      const status = await DailyTaskService.getStreakStatus(req.params.userId);
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = DailyTaskController;