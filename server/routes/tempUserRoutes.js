import express from "express";
const router = express.Router();
import { requireAuth, requireOwnership } from "../middleware/auth.js";
import {
  tempUserCreationLimiter,
  rateLimiter,
} from "../middleware/rateLimiter.js";
import {
  createTempUser,
  getTempUserById,
  addGoalToTempUser,
  deleteTempUser,
} from "../controllers/tempUserController.js";

/**
 * TempUser Routes
 * Base path: /api/temp-users
 *
 * These routes handle temporary user operations:
 * - Creating a new temporary user
 * - Getting temp user by ID
 * - Adding goals to temp user
 * - Deleting a temporary user
 */

// Apply general rate limiter to all temp user routes
router.use(rateLimiter({ maxRequests: 200, windowMs: 15 * 60 * 1000 })); // 200 requests per 15 minutes

// POST /api/temp-users - Create a new temporary user
// Apply specific stricter rate limiter for temp user creation
router.post(
  "/",
  tempUserCreationLimiter({ maxCreations: 10, windowMs: 30 * 60 * 1000 }),
  createTempUser
);

// GET /api/temp-users/:tempId - Get temporary user by ID
router.get(
  "/:tempId",
  requireAuth,
  requireOwnership((req) => req.params.tempId),
  getTempUserById
);

// POST /api/temp-users/:tempId/goals - Add a goal to temporary user
router.post(
  "/:tempId/goals",
  requireAuth,
  requireOwnership((req) => req.params.tempId),
  addGoalToTempUser
);

// DELETE /api/temp-users/:tempId - Delete a temporary user
router.delete("/:tempId", requireAuth, deleteTempUser);

export default router;
