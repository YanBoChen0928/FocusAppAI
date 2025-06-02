import express from "express";
const router = express.Router();
import { requireAuth, requireRegisteredUser } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  deleteAccount 
} from '../controllers/userController.js';

/**
 * User Routes
 * Base path: /api/users
 * 
 * These routes handle user profile operations:
 * - Get user profile
 * - Update user profile
 * - Delete user account
 */

// Apply rate limiter to all user routes
router.use(rateLimiter({ maxRequests: 100, windowMs: 15 * 60 * 1000 }));

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile information
 * @access  Private (registered users only)
 */
router.get("/profile", requireRegisteredUser, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile information
 * @access  Private (registered users only)
 */
router.put("/profile", requireRegisteredUser, updateProfile);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private (registered users only)
 */
router.delete("/account", requireRegisteredUser, deleteAccount);

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private (registered users only)
 */
router.put("/password", requireRegisteredUser, changePassword);

export default router; 