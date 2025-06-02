import express from 'express';
import { requireAuth } from '../middleware/auth.js';
// Remove unused import for ReportService
// import ReportService from '../services/ReportService.js'; 
import { generateReport } from '../controllers/reportsController.js';
import { requireOwnership } from '../middleware/auth.js';
import Goal from '../models/Goal.js';

const router = express.Router();

// Test route - no authentication required
router.get('/test', (req, res) => {
  console.log('test route called');
  res.json({ success: true, message: 'report API test success' });
});

// Authentication test route
router.get('/auth-test', requireAuth, (req, res) => {
  console.log('auth test route called, user ID:', req.user.id);
  res.json({ 
    success: true, 
    message: 'auth success',
    user: {
      id: req.user.id,
      userType: req.user.userType
    }
  });
});

/**
 * @route   POST /api/reports/:goalId
 * @desc    Generate an AI progress report for a specific goal
 * @access  Private (Requires authentication and ownership)
 */
router.post(
  '/:goalId',
  requireAuth,
  // Add ownership check middleware - ensures the user owns the goal
  requireOwnership(async (req) => {
    try {
      const goal = await Goal.findById(req.params.goalId);
      if (!goal) {
        console.warn(`Ownership check failed: Goal not found with ID ${req.params.goalId}`);
        return null; // Goal not found, ownership check fails
      }
      console.log(`Ownership check: User ${req.user.id} attempting to access goal owned by ${goal.userId}`);
      return goal.userId; // Return the owner's ID for comparison
    } catch (error) {
      console.error(`Error during ownership check for goal ${req.params.goalId}:`, error);
      return null; // Error occurred, treat as ownership failure
    }
  }),
  generateReport
);

// get latest report
router.get('/:goalId/latest', requireAuth, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;

    console.log('get latest report called:', {
      goalId,
      userId
    });

    // Simplified response
    res.json({ 
      success: true, 
      data: {
        goalId,
        userId,
        message: 'this is a test response, no actual report is retrieved'
      }
    });
  } catch (error) {
    console.error('error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
