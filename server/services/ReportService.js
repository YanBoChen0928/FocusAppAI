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
}

export default ReportService;