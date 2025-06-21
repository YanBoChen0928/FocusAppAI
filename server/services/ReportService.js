import OpenAI from 'openai';
import Progress from '../models/Progress.js';
import Goal from '../models/Goal.js';
import Report from '../models/Report.js';
import NodeCache from 'node-cache';

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
      console.log('User timezone:', userTimeZone);
      
      // Calculate time range
      let period;
      const now = new Date();
      
      console.log('Calculating time range for:', {
        timeRange,
        currentTime: now.toISOString(),
        userTimeZone
      });

      if (typeof timeRange === 'string') {
        switch (timeRange) {
          case 'last7days': {
            // last 7 days including today
            const today = startOfDay(now);
            const sevenDaysAgo = subDays(today, 6);
            period = {
              startDate: sevenDaysAgo,
              endDate: endOfDay(now)
            };
            break;
          }
          case 'today': {
            // the user's timezone today
            period = {
              startDate: startOfDay(now),
              endDate: endOfDay(now)
            };
            break;
          }
          default: {
            // default is last7days
            const today = startOfDay(now);
            const sevenDaysAgo = subDays(today, 6);
            period = {
              startDate: sevenDaysAgo,
              endDate: endOfDay(now)
            };
          }
        }
      } else if (timeRange?.startDate && timeRange?.endDate) {
        // deal with custom time range
        const customStart = parseISO(timeRange.startDate);
        const customEnd = parseISO(timeRange.endDate);
        
        period = {
          startDate: startOfDay(customStart),
          endDate: endOfDay(customEnd)
        };
      } else {
        // default is last7days
        const today = startOfDay(now);
        const sevenDaysAgo = subDays(today, 6);
        period = {
          startDate: sevenDaysAgo,
          endDate: endOfDay(now)
        };
      }

      // output detailed time range for debugging
      console.log('Calculated time range:', {
        startDate: formatISO(period.startDate),
        endDate: formatISO(period.endDate),
        startDateLocal: period.startDate.toLocaleString('en-US', { timeZone: userTimeZone }),
        endDateLocal: period.endDate.toLocaleString('en-US', { timeZone: userTimeZone }),
        timeZone: userTimeZone
      });

      // 1. get goal information
      const goal = await Goal.findById(goalId);
      if (!goal) {
        throw new Error('goal does not exist');
      }

      // 2. get progress records with proper date range
      const progress = await Progress.find({
        goalId,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }).sort({ date: -1 });

      // 3. analyze data
      const analysis = {
        totalRecords: progress.length,
        completedTasks: progress.filter(p => p.completed).length,
        completionRate: progress.length > 0 ? 
          (progress.filter(p => p.completed).length / progress.length) * 100 : 0,
        lastUpdate: progress.length > 0 ? progress[0].date : new Date()
      };

      // 4. prepare prompt
      const prompt = this._preparePrompt(goal, progress, analysis);
      
      // 5. generate AI analysis
      const aiAnalysis = await this._generateAIAnalysis(prompt);

      // 6. create report
      const report = new Report({
        goalId,
        userId,
        content: aiAnalysis,
        analysis,
        type: timeRange,
        period: {
          startDate: new Date(new Date().setHours(0, 0, 0, 0)),
          endDate: new Date(new Date().setHours(23, 59, 59, 999))
        },
        isGenerated: true
      });

      await report.save();
      return report;
    } catch (error) {
      console.error('generate report failed:', error);
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

  static async _generateAIAnalysis(prompt) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a goal-oriented AI assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('AI analysis generation failed:', error);
      throw new Error('AI analysis generation failed, please try again later');
    }
  }

  static _preparePrompt(goal, progress, analysis) {
    return `
As a professional goal analysis assistant, please generate a detailed analysis report based on the following information:

Goal Information:
Title: ${goal.title}
Current Task: ${goal.currentSettings?.dailyTask || 'None'}
Priority: ${goal.priority || 'Not set'}

Today's Progress Data:
- Total Records: ${analysis.totalRecords}
- Completed Tasks: ${analysis.completedTasks}
- Completion Rate: ${analysis.completionRate.toFixed(1)}%

Detailed Records:
${progress.map(p => `- ${new Date(p.date).toLocaleTimeString()}: ${p.content || 'No content'}`).join('\n')}

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
}

export default ReportService;