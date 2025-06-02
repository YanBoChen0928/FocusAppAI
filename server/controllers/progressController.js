import Progress from "../models/Progress.js";
import Goal from "../models/Goal.js";
import User from "../models/User.js";

/**
 * Get progress records for a specific goal
 * 
 * @route GET /api/progress?goalId=:goalId&date=:date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProgress = async (req, res) => {
  try {
    const { goalId, date, startDate, endDate } = req.query;
    
    // Validate parameters
    if (!goalId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Goal ID is required"
        }
      });
    }
    
    // Check if goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found"
        }
      });
    }
    
    // Build query
    const query = { goalId };
    
    // Add date filter if provided
    if (date) {
      // Convert string date to Date object (start of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      // End of day
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      // Filter by date range
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDateObj, $lte: endDateObj };
    }
    
    // Find progress records
    let progressRecords;
    
    if (startDate && endDate) {
      // If date range is provided, sort by date
      progressRecords = await Progress.find(query).sort({ date: 1 });
    } else {
      // Otherwise, sort by most recent first
      progressRecords = await Progress.find(query).sort({ date: -1 });
    }
    
    res.status(200).json({
      success: true,
      data: progressRecords
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch progress records",
        details: error.message
      }
    });
  }
};

/**
 * Create a new progress record
 * 
 * @route POST /api/progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createProgress = async (req, res) => {
  try {
    const { goalId, userId, date, records, checkpoints, summary } = req.body;
    
    // Validate required fields
    if (!goalId || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Goal ID and User ID are required"
        }
      });
    }
    
    // Check if goal exists and belongs to the user
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Goal not found or doesn't belong to this user"
        }
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found"
        }
      });
    }
    
    // Create progress data
    const progressData = {
      goalId,
      userId,
      date: date || new Date(),
      records: records || [],
      checkpoints: checkpoints || [],
      summary: summary || ""
    };
    
    // Calculate total duration from records
    if (records && records.length > 0) {
      progressData.totalDuration = records.reduce((total, record) => total + (record.duration || 0), 0);
    }
    
    // Create progress record
    const progress = await Progress.create(progressData);
    
    res.status(201).json({
      success: true,
      data: progress
    });
  } catch (error) {
    // Handle duplicate key error (already have a record for this date)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          message: "A progress record for this goal and date already exists",
          details: "Use PUT /api/progress/:id to update an existing record"
        }
      });
    }
    
    console.error("Error creating progress:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create progress record",
        details: error.message
      }
    });
  }
};

/**
 * Update a progress record
 * 
 * @route PUT /api/progress/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { records, checkpoints, summary } = req.body;
    
    // Find progress record
    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Progress record not found"
        }
      });
    }
    
    // Update fields if provided
    if (records) progress.records = records;
    if (checkpoints) progress.checkpoints = checkpoints;
    if (summary !== undefined) progress.summary = summary;
    
    // Recalculate total duration if records were updated
    if (records) {
      progress.totalDuration = records.reduce((total, record) => total + (record.duration || 0), 0);
    }
    
    // Save updated progress
    await progress.save();
    
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update progress record",
        details: error.message
      }
    });
  }
};

/**
 * Delete a progress record
 * 
 * @route DELETE /api/progress/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    
    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Progress record not found"
        }
      });
    }
    
    await progress.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("Error deleting progress:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete progress record",
        details: error.message
      }
    });
  }
};

/**
 * Add a record to an existing progress document
 * 
 * @route POST /api/progress/:id/records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { activity, duration, notes } = req.body;
    
    // Validate input
    if (!activity || !duration) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Activity and duration are required for a record"
        }
      });
    }
    
    // Find progress record
    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Progress record not found"
        }
      });
    }
    
    // Create new record
    const newRecord = {
      activity,
      duration,
      time: new Date(), // Current time
      notes: notes || ""
    };
    
    // Add to records array
    progress.records.push(newRecord);
    
    // Update total duration
    progress.totalDuration = (progress.totalDuration || 0) + duration;
    
    // Save updated progress
    await progress.save();
    
    res.status(201).json({
      success: true,
      data: {
        record: newRecord,
        progress
      }
    });
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to add record",
        details: error.message
      }
    });
  }
};

/**
 * Update checkpoint status
 * 
 * @route PUT /api/progress/:id/checkpoints/:checkpointId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCheckpointStatus = async (req, res) => {
  try {
    const { id, checkpointId } = req.params;
    const { completed } = req.body;
    
    // Validate input
    if (completed === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Completed status is required"
        }
      });
    }
    
    // Find progress record
    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Progress record not found"
        }
      });
    }
    
    // Find checkpoint
    const checkpoint = progress.checkpoints.find(cp => cp._id.toString() === checkpointId);
    
    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Checkpoint not found in this progress record"
        }
      });
    }
    
    // Update checkpoint status
    checkpoint.completed = completed;
    
    // If completed, add completedAt timestamp
    if (completed) {
      checkpoint.completedAt = new Date();
    } else {
      checkpoint.completedAt = undefined; // Remove completedAt if not completed
    }
    
    // Save updated progress
    await progress.save();
    
    res.status(200).json({
      success: true,
      data: {
        checkpoint,
        progress
      }
    });
  } catch (error) {
    console.error("Error updating checkpoint:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update checkpoint",
        details: error.message
      }
    });
  }
};

/**
 * Get progress summary for a date range
 * 
 * @route GET /api/progress/summary?goalId=:goalId&startDate=:startDate&endDate=:endDate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProgressSummary = async (req, res) => {
  try {
    const { goalId, startDate, endDate } = req.query;
    
    // Validate parameters
    if (!goalId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Goal ID, start date, and end date are required"
        }
      });
    }
    
    // Parse dates
    const startDateObj = new Date(startDate);
    startDateObj.setHours(0, 0, 0, 0);
    
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    
    // Find all progress records in date range
    const progressRecords = await Progress.find({
      goalId,
      date: { $gte: startDateObj, $lte: endDateObj }
    }).sort({ date: 1 });
    
    // Calculate summary statistics
    const totalDuration = progressRecords.reduce((total, record) => total + (record.totalDuration || 0), 0);
    const totalRecords = progressRecords.reduce((total, record) => total + record.records.length, 0);
    
    // Calculate checkpoint completion
    let totalCheckpoints = 0;
    let completedCheckpoints = 0;
    
    progressRecords.forEach(record => {
      totalCheckpoints += record.checkpoints.length;
      completedCheckpoints += record.checkpoints.filter(cp => cp.completed).length;
    });
    
    // Group by activity
    const activityBreakdown = {};
    progressRecords.forEach(progressRecord => {
      progressRecord.records.forEach(record => {
        const activity = record.activity;
        if (!activityBreakdown[activity]) {
          activityBreakdown[activity] = 0;
        }
        activityBreakdown[activity] += record.duration || 0;
      });
    });
    
    // Create activity array sorted by duration
    const activities = Object.keys(activityBreakdown).map(activity => ({
      activity,
      totalDuration: activityBreakdown[activity]
    })).sort((a, b) => b.totalDuration - a.totalDuration);
    
    // Return summary
    res.status(200).json({
      success: true,
      data: {
        totalDuration,
        totalRecords,
        recordDays: progressRecords.length,
        checkpoints: {
          total: totalCheckpoints,
          completed: completedCheckpoints,
          completion: totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0
        },
        activities,
        range: {
          startDate: startDateObj,
          endDate: endDateObj,
          daysInRange: Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1
        }
      }
    });
  } catch (error) {
    console.error("Error generating progress summary:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to generate progress summary",
        details: error.message
      }
    });
  }
};

export {
  getProgress,
  createProgress,
  updateProgress,
  deleteProgress,
  addRecord,
  updateCheckpointStatus,
  getProgressSummary
}; 