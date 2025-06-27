import Goal from '../models/Goal.js';
import mongoose from 'mongoose';
import ReportService from '../services/ReportService.js';
import Progress from '../models/Progress.js';
import Report from '../models/Report.js';

// --- Configuration ---
// Comment out Hugging Face related config
// const HUGGINGFACE_API_URL = process.env.HUGGINGFACE_API_URL;
// const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. AI report generation will likely fail.");
}

// --- End Configuration ---

/**
 * Builds a prompt for the AI based on goal data.
 * This is a crucial part - tailor the prompt for best results.
 * @param {Object} goal - The goal object from the database.
 * @param {Date} startDate - The start date for filtered data.
 * @param {Date} endDate - The end date for filtered data.
 * @param {Array} progressRecords - The progress records for the goal.
 * @returns {string} The constructed prompt string.
 */
const buildPrompt = (goal, startDate, endDate, progressRecords) => {
  const startDateStr = startDate ? new Date(startDate).toLocaleDateString() : 'not specified';
  const endDateStr = endDate ? new Date(endDate).toLocaleDateString() : 'not specified';
  
  let prompt = `You are a professional goal tracking and analysis assistant. Your task is to analyze the following goal progress data and provide insightful feedback.

Goal Information:
Title: "${goal.title}"
Time Period: ${startDateStr} to ${endDateStr}
Description: ${goal.description || 'Not provided'}
Motivation: ${goal.motivation || 'Not provided'}
Target Date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Not set'}

Daily Tasks:
${goal.dailyTasks && goal.dailyTasks.length > 0 ? goal.dailyTasks.map(task => `- ${task}`).join('\n') : '- None defined'}

Progress Log (${startDateStr} to ${endDateStr}):\n`;

  // Combine both dailyCards and progressRecords
  const dailyCards = goal.dailyCards
    .filter(card => {
      const cardDate = new Date(card.date);
      cardDate.setHours(0, 0, 0, 0);  // 设置为当天开始时间
      const cardEndDate = new Date(card.date);
      cardEndDate.setHours(23, 59, 59, 999);  // 设置为当天结束时间
      return (!startDate || cardDate >= startDate) && 
             (!endDate || cardEndDate <= endDate);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (dailyCards.length > 0 || progressRecords.length > 0) {
    // Process daily cards
    dailyCards.forEach(card => {
      const cardDate = new Date(card.date).toLocaleDateString();
      prompt += `--- ${cardDate} ---\n`;
      
      // Add task completions
      const completions = card.taskCompletions || {};
      const completedTasks = Object.entries(completions)
        .filter(([_, completed]) => completed)
        .map(([taskId]) => {
          const taskText = taskId.startsWith('task-')
            ? taskId.substring(5).replace(/-/g, ' ')
            : goal.dailyTasks?.find(t => `task-${t.replace(/\s+/g, '-').toLowerCase()}` === taskId) || taskId;
          return `  - Completed: ${taskText}`;
        })
        .join('\n');
      
      if (completedTasks) prompt += `${completedTasks}\n`;

      // Add card records
      if (card.records && card.records.length > 0) {
        prompt += `  Notes:\n`;
        card.records.forEach(record => {
          prompt += `    - ${record.content} (at ${new Date(record.createdAt).toLocaleTimeString()})\n`;
        });
      }
    });

    // Process progress records
    progressRecords.forEach(progress => {
      const progressDate = new Date(progress.date).toLocaleDateString();
      if (!dailyCards.some(card => new Date(card.date).toLocaleDateString() === progressDate)) {
        prompt += `--- ${progressDate} ---\n`;
        
        // Add progress records
        if (progress.records && progress.records.length > 0) {
          progress.records.forEach(record => {
            prompt += `  - ${record.activity} (${record.duration} minutes)\n`;
            if (record.notes) prompt += `    Notes: ${record.notes}\n`;
          });
        }

        // Add checkpoint updates
        if (progress.checkpoints && progress.checkpoints.length > 0) {
          prompt += `  Checkpoints:\n`;
          progress.checkpoints.forEach(checkpoint => {
            prompt += `    - ${checkpoint.title}: ${checkpoint.isCompleted ? 'Completed' : 'In Progress'}\n`;
          });
        }
      }
    });
  } else {
    prompt += `- No progress data for this time period.\n`;
  }

  prompt += `\nBased on the goal information and progress data above, please provide a comprehensive analysis in the following format:

1. Progress Analysis
- Analyze the overall progress patterns
- Highlight key achievements
- Identify consistency in task completion

2. Potential Challenges
- Point out areas needing attention
- Identify potential obstacles
- Suggest ways to overcome challenges

3. Actionable Suggestions
- Provide 2-3 specific, practical next steps
- Suggest improvements to current approach
- Recommend ways to maintain motivation

Please keep your response encouraging and practical. Focus on helping the user move forward with their goal. Format your response with clear sections and bullet points for readability.`;

  console.log("--- Generated AI Prompt ---");
  console.log(prompt);
  console.log("--- End AI Prompt ---");

  return prompt;
};

/**
 * @controller generateReport
 * @desc Fetches goal data, builds a prompt, calls AI service, and returns feedback.
 * @param {Object} req - Express request object, includes goalId in params.
 * @param {Object} res - Express response object.
 */
export const generateReport = async (req, res) => {
  const { goalId } = req.params;
  const { timeRange } = req.body;

  try {
    console.log(`Generating report for goalId: ${goalId} with timeRange:`, timeRange);
    
    // Get user ID from authenticated request
    const userId = req.user.userType === 'registered' ? req.user.id : req.user.tempId;
    console.log(`User ID for report: ${userId}, userType: ${req.user.userType}`);
    
    // Calculate time range
    let startDate, endDate;
    
    if (typeof timeRange === 'string') {
      // Handle predefined time ranges
      const now = new Date();
      switch (timeRange) {
        case 'last7days':
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        default:
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          startDate.setDate(startDate.getDate() - 7);
      }
    } else if (timeRange?.startDate && timeRange?.endDate) {
      // Handle custom date range with proper timezone handling
      startDate = new Date(timeRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(timeRange.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days with proper timezone handling
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 7);
    }
    
    console.log(`Using date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // 1. Fetch Goal Data with Progress
    const [goal, progressRecords] = await Promise.all([
      Goal.findById(goalId).lean(),
      Progress.find({
        goalId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ date: -1 }).lean()
    ]);

    if (!goal) {
      console.log(`Goal not found for ID: ${goalId}`);
      return res.status(404).json({ success: false, error: { message: 'Goal not found' } });
    }

    console.log(`Goal found: "${goal.title}"`);
    console.log(`Found ${progressRecords.length} progress records`);

    // 2. Build Prompt with both goal and progress data
    const prompt = buildPrompt(goal, startDate, endDate, progressRecords);

    // 3. Call AI Service through ReportService
    const feedbackContent = await ReportService._generateAIAnalysis(prompt);

    // 4. Format the report content
    const formattedContent = formatAIResponse(feedbackContent);
    
    // 5. CREATE AND SAVE ACTUAL REPORT TO DATABASE
    const report = new Report({
      goalId: goalId,
      userId: userId,
      period: {
        startDate: startDate,
        endDate: endDate
      },
      content: typeof formattedContent === 'object' ? JSON.stringify(formattedContent) : formattedContent,
      type: 'weekly',
      isGenerated: true,
      memos: [] // Initialize empty memos array for Phase 2.1
    });

    const savedReport = await report.save();
    console.log(`Report saved to database with ID: ${savedReport._id}`);
    
    // 6. Return standardized feedback format with REAL report ID
    console.log(`Successfully generated and saved feedback for goal: ${goalId}`);
    res.status(200).json({
      success: true,
      data: {
        id: savedReport._id, // Use the real saved report ID
        goalId: goalId,
        content: formattedContent,
        generatedAt: savedReport.createdAt,
        dateRange: {
          startDate: startDate,
          endDate: endDate
        }
      },
    });

  } catch (error) {
    console.error(`Error in generateReport for goal ${goalId}:`, error);
    res.status(500).json({
      success: false,
      error: {
        message: `Failed to generate AI report: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error' 
      }
    });
  }
};

/**
 * Formats AI response to ensure consistent structure
 * @param {string} rawContent - The raw content from AI service
 * @returns {object} Structured content object
 */
const formatAIResponse = (rawContent) => {
  // Default structure if parsing fails
  const defaultStructure = {
    summary: rawContent.substring(0, Math.min(200, rawContent.length)) + (rawContent.length > 200 ? '...' : ''),
    details: rawContent,
    sections: []
  };
  
  try {
    // Simple section detection - look for headings
    const sections = [];
    const lines = rawContent.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip separator lines
      if (trimmedLine.match(/^-{3,}$/) || trimmedLine === '---') {
        continue;
      }
      
      // Check if line looks like a heading (starts with ** or # or is all caps)
      if (trimmedLine.startsWith('**') || 
          trimmedLine.startsWith('#') || 
          (trimmedLine.length > 0 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 50)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Clean up the title - remove ** markers
        let title = trimmedLine.replace(/^\*\*|\*\*$/g, '').trim();
        title = title.replace(/^#+\s*/, '').trim(); // Remove # symbols
        
        // Skip creating a section with empty or just --- title
        if (title === '' || title === '---') {
          continue;
        }
        
        currentSection = {
          title: title,
          content: []
        };
      } else if (currentSection && trimmedLine.length > 0) {
        // Add non-empty lines to current section
        currentSection.content.push(trimmedLine);
      }
    }
    
    // Add the last section if exists
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If we found sections, return structured format
    if (sections.length > 0) {
      return {
        summary: sections[0].content.join(' ').substring(0, 200) + '...',
        details: rawContent,
        sections: sections.map(section => ({
          title: section.title,
          content: section.content.join('\n')
        }))
      };
    }
  } catch (err) {
    console.error('Error formatting AI response:', err);
  }
  
  // Fallback to default structure
  return defaultStructure;
};

// ===== MEMO CONTROLLERS - Phase 2.1 =====

/**
 * Add memo to report
 */
export const addMemo = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content, phase } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Memo content is required' }
      });
    }

    const report = await ReportService.addMemo(reportId, content.trim(), phase);

    res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Controller] Add memo failed:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Generate AI draft memo
 */
export const generateAiDraft = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await ReportService.generateAiDraft(reportId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Controller] Generate AI draft failed:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Update memo content
 */
export const updateMemo = async (req, res) => {
  try {
    const { reportId, phase } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Memo content is required' }
      });
    }

    const report = await ReportService.updateMemo(reportId, phase, content.trim());

    res.status(200).json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Controller] Update memo failed:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * List all memos for a report
 */
export const listMemos = async (req, res) => {
  try {
    const { reportId } = req.params;

    const memos = await ReportService.listMemos(reportId);

    res.status(200).json({
      success: true,
      data: { memos }
    });
  } catch (error) {
    console.error('[Controller] List memos failed:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Generate Next Week Plan - Phase 2.3
 */
export const generateNextWeekPlan = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await ReportService.generateNextWeekPlan(reportId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Controller] Generate Next Week Plan failed:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};
