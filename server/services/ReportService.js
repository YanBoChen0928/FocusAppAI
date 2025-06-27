import OpenAI from 'openai';
import Goal from '../models/Goal.js';
import Report from '../models/Report.js';
import NodeCache from 'node-cache';
import RAGService from './RAGService.js';
import { startOfDay, endOfDay, parseISO, formatISO, subDays } from 'date-fns';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const cache = new NodeCache({ stdTTL: 3600 }); // cache 1 hour

class ReportService {
  static async generateReport(goalId, userId, timeRange = 'last7days') {
    try {
      this.currentGoalId = goalId;
      
      // Get user's timezone
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Calculate time range
      let period;
      const now = new Date();

      if (typeof timeRange === 'string') {
        switch (timeRange) {
          case 'last7days': {
            const today = startOfDay(now);
            const sevenDaysAgo = subDays(today, 6);
            period = {
              startDate: sevenDaysAgo,
              endDate: endOfDay(now)
            };
            break;
          }
          case 'today': {
            period = {
              startDate: startOfDay(now),
              endDate: endOfDay(now)
            };
            break;
          }
          default: {
            const today = startOfDay(now);
            const sevenDaysAgo = subDays(today, 6);
            period = {
              startDate: sevenDaysAgo,
              endDate: endOfDay(now)
            };
          }
        }
      } else if (timeRange?.startDate && timeRange?.endDate) {
        const customStart = parseISO(timeRange.startDate);
        const customEnd = parseISO(timeRange.endDate);
        
        period = {
          startDate: startOfDay(customStart),
          endDate: endOfDay(customEnd)
        };
      }

      // Calculate days difference for analysis type determination
      const daysDifference = Math.ceil(
        (period.endDate - period.startDate) / (1000 * 60 * 60 * 24)
      );

      // Determine if deep analysis is needed
      const isDeepAnalysis = this._shouldUseDeepAnalysis(daysDifference);
      
      // Log RAG-related information
      console.log('[Analysis] Type:', isDeepAnalysis ? 'Deep Analysis' : 'Basic Analysis');
      console.log('[Analysis] Time range:', { 
        startDate: period.startDate, 
        endDate: period.endDate, 
        daysDifference 
      });
      console.log('[Analysis] Model selected:', isDeepAnalysis ? 'GPT-o4-mini + RAG' : 'GPT-4o-mini');

      // Get goal information
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('Goal does not exist');
      }

      // Get daily cards from goal (replacing progress records)
      const dailyCards = goal.dailyCards.filter(card => {
        const cardDate = new Date(card.date);
        return cardDate >= period.startDate && cardDate < period.endDate;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      // Analyze data from daily cards
      const analysis = {
        totalRecords: dailyCards.length,
        completedTasks: dailyCards.filter(card => {
          // Count cards that have either main task completed or any task completion
          const hasMainTaskCompleted = card.completed?.dailyTask;
          const hasAnyTaskCompleted = card.taskCompletions && 
            Object.values(card.taskCompletions).some(completed => completed === true);
          return hasMainTaskCompleted || hasAnyTaskCompleted;
        }).length,
        completionRate: dailyCards.length > 0 ? 
          (dailyCards.filter(card => {
            const hasMainTaskCompleted = card.completed?.dailyTask;
            const hasAnyTaskCompleted = card.taskCompletions && 
              Object.values(card.taskCompletions).some(completed => completed === true);
            return hasMainTaskCompleted || hasAnyTaskCompleted;
          }).length / dailyCards.length) * 100 : 0,
        lastUpdate: dailyCards.length > 0 ? dailyCards[0].date : new Date(),
        timeRange: {
          start: period.startDate,
          end: period.endDate,
          days: daysDifference
        }
      };

      // Prepare base prompt
      let prompt = this._preparePrompt(goal, dailyCards, analysis);
      
      // Enhance prompt with RAG if needed
      if (isDeepAnalysis) {
        console.time('[RAG] Total analysis time');
        try {
          prompt = await RAGService.enhancePromptWithContext(prompt, goalId);
          console.log('[RAG] Successfully enhanced prompt with historical context');
        } catch (error) {
          console.error('[RAG] Failed to enhance prompt:', error);
          console.warn('[RAG] Falling back to basic analysis');
        }
        console.timeEnd('[RAG] Total analysis time');
      }
      
      // Generate AI analysis
      const aiAnalysis = await this._generateAIAnalysis(prompt, isDeepAnalysis);

      // Create report
      const report = new Report({
        goalId,
        userId,
        content: aiAnalysis,
        analysis,
        type: timeRange,
        period,
        isGenerated: true,
        analysisType: isDeepAnalysis ? 'deep' : 'basic'
      });

      await report.save();

      // Save embedding for future RAG if it's a deep analysis
      if (isDeepAnalysis) {
        try {
          await RAGService.saveReportEmbedding(report);
          console.log('[RAG] Successfully saved report embedding');
        } catch (error) {
          console.error('[RAG] Failed to save report embedding:', error);
        }
      }

      return report;
    } catch (error) {
      console.error('[RAG] Generate report failed:', error);
      throw error;
    }
  }

  static async getLatestReport(goalId, userId) {
    try {
      return await Report.findOne({ goalId, userId })
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('get latest report failed:', error);
      throw error;
    }
  }

  static _shouldUseDeepAnalysis(daysDifference) {
    // Use deep analysis for:
    // 1. Time range > 21 days
    // 2. Cross-month analysis (implemented in future)
    // 3. Milestone detection (implemented in future)
    const shouldUseRAG = daysDifference >= 21;
    console.log('[RAG] Should use deep analysis:', shouldUseRAG, 'Days difference:', daysDifference);
    return shouldUseRAG;
  }

  static _preparePrompt(goal, dailyCards, analysis) {
    return `
As a professional goal analysis assistant, please generate a detailed analysis report based on the following information:

Goal Information:
Title: ${goal.title}
Current Task: ${goal.currentSettings?.dailyTask || 'None'}
Priority: ${goal.priority || 'Not set'}

Daily Progress Data:
- Total Records: ${analysis.totalRecords}
- Completed Tasks: ${analysis.completedTasks}
- Completion Rate: ${analysis.completionRate.toFixed(1)}%

Detailed Daily Records:
${dailyCards.map(card => {
  const date = new Date(card.date).toLocaleDateString();
  const taskStatus = card.completed?.dailyTask ? '✓' : '✗';
  const rewardStatus = card.completed?.dailyReward ? '✓' : '✗';
  
  // Get task completions summary
  const taskCompletions = card.taskCompletions || {};
  const completedTasksCount = Object.values(taskCompletions).filter(completed => completed === true).length;
  const totalTasksCount = Object.keys(taskCompletions).length;
  
  // Get records summary
  const recordsText = card.records && card.records.length > 0 
    ? card.records.map(r => r.content).join('; ')
    : 'No detailed records';
  
  return `- ${date}: Main Task ${taskStatus}, Reward ${rewardStatus}, Sub-tasks (${completedTasksCount}/${totalTasksCount}), Notes: ${recordsText}`;
}).join('\n')}

Please analyze from the following aspects:
1. Progress Assessment: Analyze the current progress, including completion rate and efficiency
2. Pattern Recognition: Analyze the user's work/study pattern, find the pattern
3. Improvement Suggestions: Based on the analysis, propose specific improvement suggestions
4. Encouraging Feedback: Give positive feedback and encouragement

Please reply in English, with a positive and encouraging tone, and specific suggestions that are easy to follow.
    `.trim();
  }

  static _generateSuggestions(analysis, goal) {
    const suggestions = [];

    if (analysis.totalRecords === 0) {
      suggestions.push('• Today there is no progress record, please record your progress promptly.');
    } else if (analysis.completionRate < 50) {
      suggestions.push('• The current completion rate is low, please make a more specific action plan.');
      suggestions.push('• Consider breaking the task into smaller steps and completing it step by step.');
    } else if (analysis.completionRate >= 80) {
      suggestions.push('• The completion rate is good, please continue to maintain this pace!');
      suggestions.push('• Consider increasing the difficulty of the goal to challenge yourself.');
    }

    if (goal.currentSettings?.dailyTask) {
      suggestions.push(`• The current task「${goal.currentSettings.dailyTask}」is ongoing.`);
    }

    return suggestions.join('\n');
  }

  static _generateActionPlan(analysis, goal) {
    const plans = [];
    
    if (goal.currentSettings?.dailyTask) {
      plans.push(`1. Complete the today's task: ${goal.currentSettings.dailyTask}`);
    }

    if (analysis.completionRate < 50) {
      plans.push('2. Review the incomplete tasks, find the difficulties');
      plans.push('3. Adjust the difficulty of the task or seek help');
    } else {
      plans.push('2. Record today\'s experience and心得');
      plans.push('3. Plan the重点 for tomorrow\'s task');
    }

    return plans.join('\n');
  }

  static _generateInsights(analysis, goal) {
    const insights = [];
    
    if (analysis.totalRecords > 0) {
      insights.push(`Today's task participation rate: ${analysis.completionRate.toFixed(1)}%`);
      insights.push(`Completed tasks: ${analysis.completedTasks}/${analysis.totalRecords}`);
    }
    
    return insights;
  }

  static _generateRecommendations(analysis, goal) {
    const recommendations = [];
    
    if (analysis.completionRate < 50) {
      recommendations.push('Suggest increasing the frequency of task execution');
      recommendations.push('Consider adjusting the difficulty of the task');
    } else if (analysis.completionRate >= 80) {
      recommendations.push('Try to increase the difficulty of the task');
      recommendations.push('Share successful experiences with other users');
    }
    
    return recommendations;
  }

  static async _generateAIAnalysis(prompt, isDeepAnalysis) {
    try {
      console.time('[Analysis] Generation');
      const completion = await openai.chat.completions.create({
        model: isDeepAnalysis ? "gpt-o4-mini" : "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a goal-oriented AI assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: isDeepAnalysis ? 2000 : 1000
      });
      console.timeEnd('[Analysis] Generation');

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('[Analysis] Generation failed:', error);
      if (isDeepAnalysis) {
        console.warn('[Analysis] Falling back to GPT-4o-mini due to API error');
        return this._generateAIAnalysis(prompt, false);
      }
      throw new Error('AI analysis generation failed, please try again later');
    }
  }

  // ===== MEMO FUNCTIONALITY - Phase 2.1 =====
  
  /**
   * Add memo to report (Phase 1: Original Memo)
   * @param {string} reportId - Report ID
   * @param {string} content - Memo content
   * @param {string} phase - Memo phase (originalMemo, aiDraft, finalMemo)
   * @returns {Object} Updated report
   */
  static async addMemo(reportId, content, phase = 'originalMemo') {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Generate embedding for memo content
      let embedding = null;
      try {
        embedding = await RAGService.generateEmbedding(content);
        console.log('[Memo] Successfully generated embedding for memo');
      } catch (error) {
        console.warn('[Memo] Failed to generate embedding:', error);
      }

      // Add memo to report
      const memo = {
        phase,
        content,
        timestamp: new Date(),
        embedding
      };

      report.memos.push(memo);
      await report.save();

      console.log(`[Memo] Added ${phase} memo to report ${reportId}`);
      return report;
    } catch (error) {
      console.error('[Memo] Add memo failed:', error);
      throw error;
    }
  }

  /**
   * Generate AI draft memo based on report content and user's original memo
   * @param {string} reportId - Report ID
   * @returns {Object} AI-generated draft content
   */
  static async generateAiDraft(reportId) {
    try {
      const report = await Report.findById(reportId).populate('goalId');
      if (!report) {
        throw new Error('Report not found');
      }

      // Get original memo
      const originalMemo = report.memos.find(m => m.phase === 'originalMemo');
      if (!originalMemo) {
        throw new Error('Original memo not found. Please create original memo first.');
      }

      // Prepare prompt for AI draft generation
      const prompt = this._prepareMemoPrompt(report, originalMemo.content);
      
      // Enhance with RAG context
      let enhancedPrompt = prompt;
      try {
        enhancedPrompt = await RAGService.enhancePromptWithContext(prompt, report.goalId._id);
        console.log('[Memo] Successfully enhanced prompt with RAG context');
      } catch (error) {
        console.warn('[Memo] Failed to enhance prompt with RAG:', error);
      }

      // Generate AI draft using gpt-o4-mini (RAG-enhanced)
      const aiContent = await this._generateMemoContent(enhancedPrompt, true);
      
      // Add AI draft to report
      await this.addMemo(reportId, aiContent, 'aiDraft');

      return { content: aiContent };
    } catch (error) {
      console.error('[Memo] Generate AI draft failed:', error);
      throw error;
    }
  }

  /**
   * Update memo content
   * @param {string} reportId - Report ID
   * @param {string} phase - Memo phase to update
   * @param {string} content - New content
   * @returns {Object} Updated report
   */
  static async updateMemo(reportId, phase, content) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Find memo to update
      const memoIndex = report.memos.findIndex(m => m.phase === phase);
      if (memoIndex === -1) {
        throw new Error(`Memo with phase ${phase} not found`);
      }

      // Generate new embedding
      let embedding = null;
      try {
        embedding = await RAGService.generateEmbedding(content);
      } catch (error) {
        console.warn('[Memo] Failed to generate embedding for updated memo:', error);
      }

      // Update memo
      report.memos[memoIndex].content = content;
      report.memos[memoIndex].timestamp = new Date();
      if (embedding) {
        report.memos[memoIndex].embedding = embedding;
      }

      await report.save();

      console.log(`[Memo] Updated ${phase} memo in report ${reportId}`);
      return report;
    } catch (error) {
      console.error('[Memo] Update memo failed:', error);
      throw error;
    }
  }

  /**
   * List all memos for a report
   * @param {string} reportId - Report ID
   * @returns {Array} List of memos
   */
  static async listMemos(reportId) {
    try {
      const report = await Report.findById(reportId).select('memos');
      if (!report) {
        throw new Error('Report not found');
      }

      return report.memos.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('[Memo] List memos failed:', error);
      throw error;
    }
  }

  /**
   * Prepare prompt for memo generation
   * @param {Object} report - Report object
   * @param {string} originalMemo - User's original memo content
   * @returns {string} Formatted prompt
   */
  static _prepareMemoPrompt(report, originalMemo) {
    const goal = report.goalId;
    return `
As a professional goal reflection assistant, help the user create a comprehensive weekly memo based on their AI progress analysis and initial thoughts.

Context Information:
Goal: ${goal.title}
Analysis Period: ${new Date(report.period.startDate).toLocaleDateString()} - ${new Date(report.period.endDate).toLocaleDateString()}

AI Progress Analysis:
${report.content}

User's Initial Memo:
${originalMemo}

Please create a well-structured weekly memo that:
1. **Progress Summary**: Synthesize key achievements and challenges from the analysis
2. **Personal Insights**: Incorporate and expand on the user's initial thoughts
3. **Pattern Recognition**: Identify trends and patterns in the user's progress
4. **Actionable Reflections**: Provide specific, actionable insights for improvement

Guidelines:
- Keep the tone personal and reflective
- Balance analytical insights with emotional support
- Focus on growth and learning opportunities
- Maintain a length of 200-400 words
- Use clear, engaging language

Please respond in English with a well-formatted memo.
    `.trim();
  }

  /**
   * Generate memo content using AI
   * @param {string} prompt - Generation prompt
   * @param {boolean} useAdvancedModel - Whether to use gpt-o4-mini
   * @returns {string} Generated content
   */
  static async _generateMemoContent(prompt, useAdvancedModel = true) {
    try {
      console.time('[Memo] Content generation');
      const completion = await openai.chat.completions.create({
        model: useAdvancedModel ? "gpt-o4-mini" : "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a thoughtful reflection assistant helping users create meaningful weekly memos." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });
      console.timeEnd('[Memo] Content generation');

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('[Memo] Content generation failed:', error);
      if (useAdvancedModel) {
        console.warn('[Memo] Falling back to GPT-4o-mini due to API error');
        return this._generateMemoContent(prompt, false);
      }
      throw new Error('Memo content generation failed, please try again later');
    }
  }
}

export default ReportService;