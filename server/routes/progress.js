import express from "express";
const router = express.Router();
import {
  getProgress,
  createProgress,
  updateProgress,
  deleteProgress,
  addRecord,
  updateCheckpointStatus,
  getProgressSummary
} from "../controllers/progressController.js";
import { requireAuth, requireOwnership } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import Progress from '../models/Progress.js';
import Goal from '../models/Goal.js';

/**
 * Progress Routes
 * Base path: /api/progress
 * 
 * These routes handle progress tracking operations:
 * - Get progress records for a goal
 * - Create a new progress record
 * - Update progress record
 * - Delete progress record
 * - Add individual record to a progress document
 * - Update checkpoint status
 * - Get progress summary for a date range
 */

// Apply rate limiter to all progress routes
router.use(rateLimiter({ maxRequests: 200, windowMs: 15 * 60 * 1000 }));

// GET /api/progress - Get progress records
// Use query params: ?goalId=123&date=2023-03-21 or ?goalId=123&startDate=2023-03-01&endDate=2023-03-31
router.get("/", requireAuth, async (req, res, next) => {
  try {
    // Check if the user is the owner of the goal
    if (req.query.goalId) {
      const goal = await Goal.findById(req.query.goalId);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { message: "Goal not found" }
        });
      }
      
      if ((req.user.userType === 'registered' && goal.userId.toString() !== req.user.id.toString()) ||
          (req.user.userType === 'temp' && goal.userId !== req.user.tempId)) {
        return res.status(403).json({
          success: false,
          error: { message: "Access denied. You can only access your own progress data." }
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}, getProgress);

// GET /api/progress/summary - Get progress summary for a date range
// Use query params: ?goalId=123&startDate=2023-03-01&endDate=2023-03-31
router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    // Check if the user is the owner of the goal
    if (req.query.goalId) {
      const goal = await Goal.findById(req.query.goalId);
      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { message: "Goal not found" }
        });
      }
      
      if ((req.user.userType === 'registered' && goal.userId.toString() !== req.user.id.toString()) ||
          (req.user.userType === 'temp' && goal.userId !== req.user.tempId)) {
        return res.status(403).json({
          success: false,
          error: { message: "Access denied. You can only access your own progress data." }
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}, getProgressSummary);

// POST /api/progress - Create a new progress record
router.post("/", requireAuth, createProgress);

// PUT /api/progress/:id - Update a progress record
router.put("/:id", requireAuth, requireOwnership(async (req) => {
  // Get the progress from database to check ownership
  const progress = await Progress.findById(req.params.id);
  if (!progress) return null;
  
  // If the progress belongs to a goal, check the goal's owner
  if (progress.goalId) {
    const goal = await Goal.findById(progress.goalId);
    return goal ? goal.userId : null;
  }
  
  return progress.userId;
}), updateProgress);

// DELETE /api/progress/:id - Delete a progress record
router.delete("/:id", requireAuth, requireOwnership(async (req) => {
  // Get the progress from database to check ownership
  const progress = await Progress.findById(req.params.id);
  if (!progress) return null;
  
  // If the progress belongs to a goal, check the goal's owner
  if (progress.goalId) {
    const goal = await Goal.findById(progress.goalId);
    return goal ? goal.userId : null;
  }
  
  return progress.userId;
}), deleteProgress);

// POST /api/progress/:id/records - Add a record to an existing progress document
router.post("/:id/records", requireAuth, requireOwnership(async (req) => {
  // Get the progress from database to check ownership
  const progress = await Progress.findById(req.params.id);
  if (!progress) return null;
  
  // If the progress belongs to a goal, check the goal's owner
  if (progress.goalId) {
    const goal = await Goal.findById(progress.goalId);
    return goal ? goal.userId : null;
  }
  
  return progress.userId;
}), addRecord);

// PUT /api/progress/:id/checkpoints/:checkpointId - Update checkpoint status
router.put("/:id/checkpoints/:checkpointId", requireAuth, requireOwnership(async (req) => {
  // Get the progress from database to check ownership
  const progress = await Progress.findById(req.params.id);
  if (!progress) return null;
  
  // If the progress belongs to a goal, check the goal's owner
  if (progress.goalId) {
    const goal = await Goal.findById(progress.goalId);
    return goal ? goal.userId : null;
  }
  
  return progress.userId;
}), updateCheckpointStatus);

export default router; 