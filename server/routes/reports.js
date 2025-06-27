import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ReportService from '../services/ReportService.js';
import { generateReport } from '../controllers/reportsController.js';
import { requireOwnership } from '../middleware/auth.js';
import Goal from '../models/Goal.js';
import Report from '../models/Report.js';

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
    // Fix: Support both registered and temp users
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;

    console.log('get latest report called:', {
      goalId,
      userId,
      userType: req.user.userType
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

// ===== MEMO ROUTES - Phase 2.1 =====

/**
 * @route   POST /api/reports/:reportId/memos
 * @desc    Add original memo to report
 * @access  Private
 */
router.post('/:reportId/memos', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content, phase = 'originalMemo' } = req.body;
    // Fix: Support both registered and temp users
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;

    console.log('[Memo API] Add memo request:', { reportId, phase, userId, userType: req.user.userType });

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Memo content is required'
      });
    }

    // Verify report ownership
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (String(report.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only add memos to your own reports'
      });
    }

    // Add memo
    const updatedReport = await ReportService.addMemo(reportId, content.trim(), phase);

    res.json({
      success: true,
      data: {
        reportId,
        memo: updatedReport.memos[updatedReport.memos.length - 1],
        message: `${phase} memo added successfully`
      }
    });

  } catch (error) {
    console.error('[Memo API] Add memo failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add memo'
    });
  }
});

/**
 * @route   POST /api/reports/:reportId/memos/suggest
 * @desc    Generate AI draft memo based on report and original memo
 * @access  Private
 */
router.post('/:reportId/memos/suggest', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    // Fix: Support both registered and temp users
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;

    console.log('[Memo API] Generate AI draft request:', { reportId, userId, userType: req.user.userType });

    // Verify report ownership
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (String(report.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only generate drafts for your own reports'
      });
    }

    // Generate AI draft
    const result = await ReportService.generateAiDraft(reportId);

    res.json({
      success: true,
      data: {
        reportId,
        content: result.content,
        message: 'AI draft generated successfully'
      }
    });

  } catch (error) {
    console.error('[Memo API] Generate AI draft failed:', error);
    
    // Handle specific error cases
    if (error.message.includes('Original memo not found')) {
      return res.status(400).json({
        success: false,
        error: 'Please create an original memo first before generating AI draft'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI draft'
    });
  }
});

/**
 * @route   PATCH /api/reports/:reportId/memos/:phase
 * @desc    Update memo content
 * @access  Private
 */
router.patch('/:reportId/memos/:phase', requireAuth, async (req, res) => {
  try {
    const { reportId, phase } = req.params;
    const { content } = req.body;
    // Fix: Support both registered and temp users
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;

    console.log('[Memo API] Update memo request:', { reportId, phase, userId, userType: req.user.userType });

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Memo content is required'
      });
    }

    // Validate phase
    const validPhases = ['originalMemo', 'aiDraft', 'finalMemo'];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({
        success: false,
        error: `Invalid phase. Must be one of: ${validPhases.join(', ')}`
      });
    }

    // Verify report ownership
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    if (String(report.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only update your own memos'
      });
    }

    // Update memo
    const updatedReport = await ReportService.updateMemo(reportId, phase, content.trim());
    const updatedMemo = updatedReport.memos.find(m => m.phase === phase);

    res.json({
      success: true,
      data: {
        reportId,
        memo: updatedMemo,
        message: `${phase} memo updated successfully`
      }
    });

  } catch (error) {
    console.error('[Memo API] Update memo failed:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update memo'
    });
  }
});

/**
 * @route   GET /api/reports/:reportId/memos
 * @desc    Get all memos for a report
 * @access  Private
 */
router.get('/:reportId/memos', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    // Fix: Support both registered and temp users
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;

    console.log('[Memo API] List memos request:', { reportId, userId, userType: req.user.userType });

    // Verify report ownership
    const report = await Report.findById(reportId);
    if (!report) {
      console.log('[Memo API] Report not found in database:', reportId);
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // DETAILED DEBUG LOGGING FOR USER ID MISMATCH
    console.log('[Memo API] === DEBUGGING USER ID MISMATCH ===');
    console.log('[Memo API] Current user info:', {
      userType: req.user.userType,
      id: req.user.id,
      tempId: req.user.tempId,
      calculatedUserId: userId
    });
    console.log('[Memo API] Report info:', {
      reportId: report._id,
      reportUserId: report.userId,
      reportUserIdType: typeof report.userId,
      goalId: report.goalId
    });
    console.log('[Memo API] ID comparison:', {
      originalMatch: report.userId === userId,
      strictMatch: report.userId === userId,
      reportUserIdString: String(report.userId),
      currentUserIdString: String(userId),
      stringMatch: String(report.userId) === String(userId),
      fixedComparison: String(report.userId) === String(userId)
    });
    console.log('[Memo API] ==========================================');

    if (String(report.userId) !== String(userId)) {
      console.log('[Memo API] ACCESS DENIED - User ID mismatch');
      console.log('[Memo API] Expected userId:', report.userId);
      console.log('[Memo API] Current userId:', userId);
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own memos',
        debug: {
          reportUserId: report.userId,
          currentUserId: userId,
          userType: req.user.userType
        }
      });
    }

    // Get memos
    const memos = await ReportService.listMemos(reportId);

    res.json({
      success: true,
      data: {
        reportId,
        memos,
        count: memos.length
      }
    });

  } catch (error) {
    console.error('[Memo API] List memos failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve memos'
    });
  }
});

export default router;
