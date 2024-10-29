const DailyTaskService = require('../services/dailyTaskService');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

class DailyTaskController {
  static async createDailyTask(req, res) {
    try {
      // Validate userId if it's part of the request body
      if (req.body.userId && !ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format. Must be a valid MongoDB ObjectId'
        });
      }

      const task = await DailyTaskService.createDailyTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async updateDailyTask(req, res) {
    try {
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({
          error: 'Invalid taskId format. Must be a valid MongoDB ObjectId'
        });
      }

      // Validate userId if it's being updated
      if (req.body.userId && !ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format in request body. Must be a valid MongoDB ObjectId'
        });
      }

      const taskId = new ObjectId(req.params.taskId);
      const task = await DailyTaskService.updateDailyTask(taskId, req.body);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async deleteDailyTask(req, res) {
    try {
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({
          error: 'Invalid taskId format. Must be a valid MongoDB ObjectId'
        });
      }

      const taskId = new ObjectId(req.params.taskId);
      const result = await DailyTaskService.deleteDailyTask(taskId);
      
      if (!result) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getAllDailyTasks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 32;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: 'Page and limit must be positive integers'
        });
      }

      // If userId filter is provided, validate it
      if (req.query.userId && !ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format in query. Must be a valid MongoDB ObjectId'
        });
      }

      const tasks = await DailyTaskService.getAllDailyTasks(page, limit, req.query);
      res.json(tasks);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getDailyTaskById(req, res) {
    try {
      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({
          error: 'Invalid taskId format. Must be a valid MongoDB ObjectId'
        });
      }

      const taskId = new ObjectId(req.params.taskId);
      const task = await DailyTaskService.getDailyTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json(task);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async completeDaily(req, res) {
    try {
      if (!ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format. Must be a valid MongoDB ObjectId'
        });
      }

      if (!ObjectId.isValid(req.params.taskId)) {
        return res.status(400).json({
          error: 'Invalid taskId format. Must be a valid MongoDB ObjectId'
        });
      }

      const userId = new ObjectId(req.params.userId);
      const taskId = new ObjectId(req.params.taskId);

      const result = await DailyTaskService.completeDaily(userId, taskId);
      
      if (!result) {
        return res.status(404).json({ error: 'Task or user not found' });
      }
      
      res.json(result);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getCompletionHistory(req, res) {
    try {
      if (!ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format. Must be a valid MongoDB ObjectId'
        });
      }

      const userId = new ObjectId(req.params.userId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 32;

      // Validate pagination parameters
      if (page < 1 || limit < 1) {
        return res.status(400).json({
          error: 'Page and limit must be positive integers'
        });
      }

      const history = await DailyTaskService.getCompletionHistory(userId, page, limit);
      
      if (!history) {
        return res.status(404).json({ error: 'No completion history found' });
      }
      
      res.json(history);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  static async getStreakStatus(req, res) {
    try {
      if (!ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({
          error: 'Invalid userId format. Must be a valid MongoDB ObjectId'
        });
      }

      const userId = new ObjectId(req.params.userId);
      const status = await DailyTaskService.getStreakStatus(userId);
      
      if (!status) {
        return res.status(404).json({ error: 'No streak status found' });
      }
      
      res.json(status);
    } catch (error) {
      const statusCode = error.name === 'ValidationError' ? 400 : 500;
      res.status(statusCode).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = DailyTaskController;