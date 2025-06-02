import Goal from '../models/Goal.js';
import axios from 'axios'; // Keep axios
// import OpenAI from 'openai'; // Remove OpenAI library import
import mongoose from 'mongoose';

// --- Configuration ---
const HUGGINGFACE_API_URL = process.env.HUGGINGFACE_API_URL; // Read standard API URL
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
// const HF_MODEL_NAME = process.env.HF_MODEL_NAME; // No longer strictly needed for axios call if URL includes it
// const HUGGINGFACE_API_BASE_URL = process.env.HUGGINGFACE_API_BASE_URL; // Remove Base URL usage


if (!HUGGINGFACE_API_TOKEN) {
  console.warn("HUGGINGFACE_API_TOKEN is not set. AI report generation will likely fail.");
}
if (!HUGGINGFACE_API_URL) {
  console.warn("HUGGINGFACE_API_URL is not set in .env file. AI report generation will likely fail.");
}
// --- End Configuration ---

/**
 * Builds a prompt for the AI based on goal data.
 * This is a crucial part - tailor the prompt for best results.
 * @param {Object} goal - The goal object from the database.
 * @param {Date} startDate - The start date for filtered data.
 * @param {Date} endDate - The end date for filtered data.
 * @returns {string} The constructed prompt string.
 */
const buildPrompt = (goal, startDate, endDate) => {
  const startDateStr = startDate ? new Date(startDate).toLocaleDateString() : 'not specified';
  const endDateStr = endDate ? new Date(endDate).toLocaleDateString() : 'not specified';
  
  let prompt = `Analyze the progress for the goal titled "${goal.title}" from ${startDateStr} to ${endDateStr}.\n\n`;
  prompt += `Goal Description: ${goal.description || 'Not provided'}\n`;
  prompt += `Motivation: ${goal.motivation || 'Not provided'}\n`;
  prompt += `Target Date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Not set'}\n\n`;
  prompt += `Daily Tasks Defined:\n${goal.dailyTasks && goal.dailyTasks.length > 0 ? goal.dailyTasks.map(task => `- ${task}`).join('\n') : '- None'}\n\n`;
  prompt += `Progress Log (${startDateStr} to ${endDateStr}):\n`;

  // Filter dailyCards within the date range
  const filteredCards = goal.dailyCards
    .filter(card => {
      const cardDate = new Date(card.date);
      return (!startDate || cardDate >= new Date(startDate)) && 
             (!endDate || cardDate <= new Date(endDate));
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  if (filteredCards.length > 0) {
    filteredCards.forEach(card => {
      const cardDate = new Date(card.date).toLocaleDateString();
      prompt += `--- ${cardDate} ---\n`;
      const completions = card.taskCompletions || {};
      const completedTasks = Object.entries(completions)
                                   .filter(([_, completed]) => completed)
                                   .map(([taskId]) => {
                                        // Extract task text from taskId (adjust if ID format changes)
                                        const taskText = taskId.startsWith('task-')
                                            ? taskId.substring(5).replace(/-/g, ' ')
                                            : goal.dailyTasks?.find(t => `task-${t.replace(/\s+/g, '-').toLowerCase()}` === taskId) || taskId;
                                        return `  - Completed: ${taskText}`;
                                    })
                                    .join('\n');
      const incompleteTasks = Object.entries(completions)
                                    .filter(([_, completed]) => !completed)
                                    .map(([taskId]) => {
                                        const taskText = taskId.startsWith('task-')
                                            ? taskId.substring(5).replace(/-/g, ' ')
                                            : goal.dailyTasks?.find(t => `task-${t.replace(/\s+/g, '-').toLowerCase()}` === taskId) || taskId;
                                        return `  - Incomplete: ${taskText}`;
                                    })
                                    .join('\n');

      if (completedTasks) prompt += `${completedTasks}\n`;
      if (incompleteTasks) prompt += `${incompleteTasks}\n`;

      if (card.records && card.records.length > 0) {
        prompt += `  Notes:\n`;
        card.records.forEach(record => {
          prompt += `    - ${record.content} (at ${new Date(record.createdAt).toLocaleTimeString()})\n`;
        });
      } else {
        prompt += `  No notes recorded.\n`;
      }
    });
  } else {
    // Simplified message for no progress data
    prompt += `- No progress data for this time period.\n`;
  }

  // Simplified instruction for Mistral model
  prompt += `\nBased on the goal information${filteredCards.length > 0 ? ' and progress data' : ''}, please provide:

1. Progress Analysis: ${filteredCards.length === 0 ? 'General insights about this goal.' : 'Brief analysis of progress patterns.'}

2. Potential Challenges: ${filteredCards.length === 0 ? 'Possible obstacles for this type of goal.' : 'Key areas needing attention.'}

3. Actionable Suggestions: ${filteredCards.length === 0 ? '2-3 specific actions to make progress on this goal.' : '2-3 specific next steps.'}

Keep your response encouraging and practical. Focus on helping the user move forward with their goal.`;

  console.log("--- Generated AI Prompt ---");
  console.log(prompt);
  console.log("--- End AI Prompt ---");

  return prompt;
};

/**
 * Calls the external AI service using Axios.
 * @param {string} prompt - The prompt to send to the AI.
 * @returns {Promise<string>} A promise that resolves with the AI-generated feedback content.
 */
const callAIService = async (prompt) => {
  if (!HUGGINGFACE_API_TOKEN) {
    throw new Error("AI service token is not configured.");
  }
  if (!HUGGINGFACE_API_URL) {
    throw new Error("AI service URL is not configured.");
  }

  try {
    console.log(`DEBUG: Attempting to call AI service. URL: ${HUGGINGFACE_API_URL}`);
    console.log(`Calling AI service (axios) at: ${HUGGINGFACE_API_URL}`);
    
    // Mistral-specific formatting - use a proper chat format
    const mistralPrompt = {
      inputs: prompt,
      parameters: {
        max_new_tokens: 300, // Increased for Mistral
        return_full_text: false,
        temperature: 0.5,  // Reduced temperature for more focused responses
        top_p: 0.9,       // Add top_p for Mistral
      }
    };
    
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      mistralPrompt,
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000 // 45 seconds timeout
      }
    );

    console.log('AI service response status:', response.status);
    console.log('AI service raw response data:', JSON.stringify(response.data, null, 2));

    // Extract feedback - adjust for Mistral response format
    let feedbackContent = "Error: Could not extract feedback from AI response.";
    if (Array.isArray(response.data) && response.data[0] && response.data[0].generated_text) {
      feedbackContent = response.data[0].generated_text.trim();
    } else if (response.data && response.data.generated_text) {
      feedbackContent = response.data.generated_text.trim();
    } else if (typeof response.data === 'string') {
      // Mistral might return a simple string
      feedbackContent = response.data.trim();
    } else {
      console.error("Unexpected AI response format. Raw data:", response.data);
    }

    if (feedbackContent.startsWith("Error:")) {
      throw new Error("Failed to extract valid feedback from AI response.");
    }

    // Simple post-processing
    feedbackContent = feedbackContent.replace(/<pad>/g, '').replace(/<\/s>/g, '').trim();

    console.log('Extracted AI feedback:', feedbackContent);
    return feedbackContent;

  } catch (error) {
    console.error(`Error calling AI service (axios): ${error.message}`);
    if (error.response) {
      console.error('AI Service Error Response Status:', error.response.status);
      console.error('AI Service Error Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('AI Service No Response Received');
    } else {
      console.error('AI Service Request Setup Error:', error.message);
    }

    if (error.response?.status === 401) {
      throw new Error("AI service authentication failed. Check API token.");
    } else if (error.response?.status === 429) {
      throw new Error("AI service rate limit exceeded. Please try again later.");
    } else if (error.response?.status === 503) {
      throw new Error("AI service is unavailable or model is loading. Please try again later.");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("AI service request timed out. Please try again later.");
    }
    throw new Error(`Failed to get feedback from AI service. Status: ${error.response?.status || 'N/A'}, Data: ${JSON.stringify(error.response?.data) || error.message}`);
  }
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
    
    // Set default time range (if not provided)
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Default to past 7 days
    let endDate = new Date();
    
    // If time range is provided, use the provided values
    if (timeRange && timeRange.startDate && timeRange.endDate) {
      startDate = new Date(timeRange.startDate);
      endDate = new Date(timeRange.endDate);
    }
    
    console.log(`Using date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // 1. Fetch Goal Data
    const goal = await Goal.findById(goalId).lean();

    if (!goal) {
      console.log(`Goal not found for ID: ${goalId}`);
      return res.status(404).json({ success: false, error: { message: 'Goal not found' } });
    }

    console.log(`Goal found: "${goal.title}"`);

    // 2. Build Prompt with date range
    const prompt = buildPrompt(goal, startDate, endDate);

    // 3. Call AI Service
    const feedbackContent = await callAIService(prompt);

    // 4. Generate a unique report ID 
    const reportId = new mongoose.Types.ObjectId().toString();
    
    // 5. Format the report content in a structured way
    const formattedContent = formatAIResponse(feedbackContent);
    
    // 6. Return standardized feedback format to Frontend
    console.log(`Successfully generated feedback for goal: ${goalId}`);
    res.status(200).json({
      success: true,
      data: {
        id: reportId,
        goalId: goalId,
        content: formattedContent,
        generatedAt: new Date(),
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
