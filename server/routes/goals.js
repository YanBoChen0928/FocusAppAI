import express from "express";
const router = express.Router();
import {
  getAllGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateGoalStatus,
  addOrUpdateDailyCard
} from "../controllers/goalsController.js";
import { requireAuth, requireOwnership } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import Goal from '../models/Goal.js';

/**
 * Goals Routes
 * Base path: /api/goals
 * 
 * These routes handle goal management operations:
 * - Get all goals for a user
 * - Create a new goal
 * - Get details for a specific goal
 * - Update a goal
 * - Delete a goal
 * - Update goal status
 * - Add/update daily card
 */

// Apply rate limiter to all goal routes
router.use(rateLimiter({ maxRequests: 200, windowMs: 15 * 60 * 1000 }));

// GET /api/goals/:userId - Get all goals for a user
router.get("/:userId", requireAuth, requireOwnership((req) => req.params.userId), getAllGoals);

// POST /api/goals - Create a new goal
router.post("/", requireAuth, async (req, res, next) => {
  try {
    // check and record user information and request body
    const { userId } = req.body;
    const authUser = req.user;
    
    console.log("create goal request:", { 
      authenticatedUser: {
        type: authUser.userType,
        ID: authUser.userType === 'registered' ? authUser.id : authUser.tempId
      },
      requestBodyUserId: userId,
      isTempId: userId && userId.toString().startsWith('temp_'),
      fullRequestBody: {
        ...req.body,
        description: req.body.description ? `${req.body.description.substring(0, 20)}...` : undefined
      }
    });
    
    // temp user authentication
    if (userId && userId.toString().startsWith('temp_')) {
      // ensure the goal is created by the same temp user
      if (authUser.userType !== 'temp' || authUser.tempId !== userId) {
        console.log("temp user ID does not match:", {
          authTempId: authUser.tempId,
          requestUserId: userId
        });
        return res.status(403).json({
          success: false,
          error: { message: 'no permission to create goal for other users' }
        });
      }
      
      console.log("temp user authentication passed, continue to create goal");
      
      // check if the temp user exists
      try {
        const TempUser = await import("../models/TempUser.js").then(module => module.default);
        const tempUser = await TempUser.findOne({ tempId: userId });
        
        if (!tempUser) {
          console.log(`temp user does not exist: ${userId}`);
          return res.status(404).json({
            success: false,
            error: {
              message: "temp user does not exist, please refresh the page and try again"
            }
          });
        }
      } catch (err) {
        console.error("error querying temp user:", err);
        return res.status(500).json({
          success: false,
          error: {
            message: "error verifying temp user",
            details: err.message
          }
        });
      }
    }
    
    // continue to execute the original createGoal controller
    next();
  } catch (error) {
    console.error("route middleware error:", error);
    next(error);
  }
}, createGoal);

// GET /api/goals/detail/:id - Get a specific goal
router.get("/detail/:id", requireAuth, requireOwnership(async (req) => {
  // Get the goal from database to check ownership
  const goal = await Goal.findById(req.params.id);
  return goal ? goal.userId : null;
}), getGoalById);

// PUT /api/goals/:id - Update a goal
router.put("/:id", requireAuth, requireOwnership(async (req) => {
  // Get the goal from database to check ownership
  const goal = await Goal.findById(req.params.id);
  return goal ? goal.userId : null;
}), updateGoal);

// DELETE /api/goals/:id - Delete a goal
router.delete("/:id", requireAuth, requireOwnership(async (req) => {
  // Get the goal from database to check ownership
  const goal = await Goal.findById(req.params.id);
  return goal ? goal.userId : null;
}), deleteGoal);

// PUT /api/goals/:id/status - Update goal status
router.put("/:id/status", requireAuth, requireOwnership(async (req) => {
  // Get the goal from database to check ownership
  const goal = await Goal.findById(req.params.id);
  return goal ? goal.userId : null;
}), updateGoalStatus);

// POST /api/goals/:id/daily-card - Add or update a daily card
router.post("/:id/daily-card", requireAuth, requireOwnership(async (req) => {
  // Get the goal from database to check ownership
  const goal = await Goal.findById(req.params.id);
  return goal ? goal.userId : null;
}), addOrUpdateDailyCard);

export default router; 