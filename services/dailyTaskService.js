const DailyTask = require('../models/DailyTask');
const DailyCompletedTask = require('../models/DailyCompletedTask');
const Streak = require('../models/Streak');
const { User } = require('../models/User'); // Update this line to destructure User from the export
const mongoose = require('mongoose');
const { areConsecutiveDays, getDailyPoints } = require('../utils/streakUtils');

class DailyTaskService {
  static async createDailyTask(taskData) {
    try {
      const task = new DailyTask({
        ...taskData,
        points: getDailyPoints(taskData.dayNumber)
      });
      return await task.save();
    } catch (error) {
      throw new Error(`Error creating daily task: ${error.message}`);
    }
  }

  static async updateDailyTask(taskId, updateData) {
    try {
      const task = await DailyTask.findByIdAndUpdate(
        taskId,
        { ...updateData },
        { new: true, runValidators: true }
      );
      if (!task) throw new Error('Daily task not found');
      return task;
    } catch (error) {
      throw new Error(`Error updating daily task: ${error.message}`);
    }
  }

  static async deleteDailyTask(taskId) {
    try {
      const task = await DailyTask.findByIdAndDelete(taskId);
      if (!task) throw new Error('Daily task not found');
      return { message: 'Daily task deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting daily task: ${error.message}`);
    }
  }

  static async getAllDailyTasks(page = 1, limit = 32) {
    try {
      const skip = (page - 1) * limit;
      const tasks = await DailyTask.find()
        .sort({ dayNumber: 1 })
        .skip(skip)
        .limit(limit);
      
      const total = await DailyTask.countDocuments();
      
      return {
        tasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Error fetching daily tasks: ${error.message}`);
    }
  }

  static async getDailyTaskById(taskId) {
    try {
      const task = await DailyTask.findById(taskId);
      if (!task) throw new Error('Daily task not found');
      return task;
    } catch (error) {
      throw new Error(`Error fetching daily task: ${error.message}`);
    }
  }

  static async completeDaily(userId, dailyTaskId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(dailyTaskId)) {
        throw new Error('Invalid dailyTaskId format');
      }

      // Use telegramUserId instead of telegramId to match the schema
      const user = await User.findOne({ telegramUserId: userId.toString() });
      if (!user) throw new Error('User not found');

      const streak = await Streak.findOne({ userId: userId.toString() }) || 
                    new Streak({ userId: userId.toString() });
                    
      const task = await DailyTask.findById(dailyTaskId);
      const now = new Date();

      if (!task) throw new Error('Daily task not found');

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const existingCompletion = await DailyCompletedTask.findOne({
        userId: userId.toString(),
        completedAt: { $gte: todayStart, $lte: todayEnd }
      });

      if (existingCompletion) {
        throw new Error('You have already completed a daily task today');
      }

      if (!streak.lastCheckIn) {
        streak.currentStreak = 1;
      } else if (areConsecutiveDays(streak.lastCheckIn, now)) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }

      streak.highestStreak = Math.max(streak.highestStreak, streak.currentStreak);
      streak.lastCheckIn = now;

      const completedTask = new DailyCompletedTask({
        userId: userId.toString(),
        dailyTaskId,
        streakDay: streak.currentStreak,
        points: getDailyPoints(streak.currentStreak)
      });

      // Update user balance and total earnings
      user.balance = (user.balance || 0) + completedTask.points;
      user.totalEarnings = (user.totalEarnings || 0) + completedTask.points;
      user.tasksCompleted.push(dailyTaskId);

      await Promise.all([
        completedTask.save(),
        streak.save(),
        user.save()
      ]);

      return {
        streakDay: streak.currentStreak,
        points: completedTask.points,
        totalBalance: user.balance,
        highestStreak: streak.highestStreak
      };
    } catch (error) {
      throw new Error(`Error completing daily task: ${error.message}`);
    }
  }

  static async getCompletionHistory(userId, page = 1, limit = 32) {
    try {
      const skip = (page - 1) * limit;
      
      const completions = await DailyCompletedTask
        .find({ userId: userId.toString() })
        .populate('dailyTaskId', 'topic description dayNumber')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DailyCompletedTask.countDocuments({ 
        userId: userId.toString() 
      });

      return {
        completions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      };
    } catch (error) {
      throw new Error(`Error fetching completion history: ${error.message}`);
    }
  }

  static async getStreakStatus(userId) {
    try {
      const streak = await Streak.findOne({ userId: userId.toString() }) || 
                    new Streak({ userId: userId.toString() });
      const now = new Date();
      
      const isStreakActive = streak.lastCheckIn && 
        areConsecutiveDays(streak.lastCheckIn, now);

      return {
        currentStreak: streak.currentStreak,
        highestStreak: streak.highestStreak,
        lastCheckIn: streak.lastCheckIn,
        isStreakActive,
        nextPoints: getDailyPoints(isStreakActive ? streak.currentStreak + 1 : 1)
      };
    } catch (error) {
      throw new Error(`Error fetching streak status: ${error.message}`);
    }
  }
}

module.exports = DailyTaskService;