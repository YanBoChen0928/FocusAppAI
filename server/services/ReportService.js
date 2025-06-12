import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
import Progress from '../models/Progress.js';
import Goal from '../models/Goal.js';
import Report from '../models/Report.js';
import RAGService from './RAGService.js';
import NodeCache from 'node-cache';
import { formatISO, parseISO, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns';
const cache = new NodeCache({ stdTTL: 3600 }); // cache 1 hour

// Initialize AI clients
const AI_SERVICE = process.env.AI_SERVICE || 'openai'; // 'openai' or 'huggingface'
const VALID_AI_SERVICES = ['openai', 'huggingface'];
if (!VALID_AI_SERVICES.includes(AI_SERVICE)) {
  throw new Error(`Invalid AI_SERVICE value: '${AI_SERVICE}'. Valid options are: ${VALID_AI_SERVICES.join(', ')}`);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Hugging Face client only if it's selected
const hf = AI_SERVICE === 'huggingface' ? new HfInference(process.env.HUGGING_FACE_API_KEY) : null;

class ReportService {
  static async generateReport(goalId, userId, timeRange = 'last7days') {
    try {
      this.currentGoalId = goalId;
      
      // Calculate time range
      let period;
      if (typeof timeRange === 'string') {
        const now = new Date();
        switch (timeRange) {
          case 'last7days':
            period = {
              startDate: startOfDay(subDays(now, 6)), // last 7 days including today
              endDate: endOfDay(now)
            };
            break;
          case 'today':
            period = {
              startDate: startOfDay(now),
              endDate: endOfDay(now)
            };
            break;
          default:
            period = {
              startDate: startOfDay(subDays(now, 6)),
              endDate: endOfDay(now)
            };
        }
      } else if (timeRange?.startDate && timeRange?.endDate) {
        period = {
          startDate: startOfDay(parseISO(timeRange.startDate)),
          endDate: endOfDay(parseISO(timeRange.endDate))
        };
      } else {
        // Default to last 7 days
        const now = new Date();
        period = {
          startDate: startOfDay(subDays(now, 6)),
          endDate: endOfDay(now)
        };
      }

      console.log('Using date range:', {
        startDate: formatISO(period.startDate),
        endDate: formatISO(period.endDate)
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
          $gte: period.startDate,
          $lte: period.endDate
        }
      }).sort({ date: -1 });

      console.log(`Found ${progress.length} progress records for date range`);

      // 3. analyze data
      const analysis = {
        totalRecords: progress.length,
        completedTasks: progress.filter(p => p.completed).length,
        completionRate: progress.length > 0 ? 
          (progress.filter(p => p.completed).length / progress.length) * 100 : 0,
        lastUpdate: progress.length > 0 ? progress[0].date : new Date()
      };

      // 4. prepare prompt
      const prompt = this._preparePrompt(goal, progress, analysis, period);
      
      // 5. generate AI analysis
      const aiAnalysis = await this._generateAIAnalysis(prompt);

      // 6. create report with proper period
      const report = new Report({
        goalId,
        userId,
        content: aiAnalysis,
        analysis,
        type: timeRange,
        period: {
          startDate: period.startDate,
          endDate: period.endDate
        },
        isGenerated: true
      });

      await report.save();
      
      try {
        await RAGService.saveReportEmbedding(report);
      } catch (ragError) {
        console.warn('Failed to save report embedding:', ragError);
      }
      
      return report;
    } catch (error) {
      console.error('generate report failed:', error);
      throw error;
    } finally {
      this.currentGoalId = null;
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
      if (AI_SERVICE === 'openai') {
        return await this._generateOpenAIAnalysis(prompt);
      } else {
        return await this._generateHuggingFaceAnalysis(prompt);
      }
    } catch (error) {
      console.error(`${AI_SERVICE} analysis generation failed:`, error);
      throw new Error('AI analysis generation failed, please try again later');
    }
  }

  static async _generateOpenAIAnalysis(prompt) {
    try {
      console.log('Starting OpenAI analysis generation with model:', 'gpt-4');
      console.log('AI_SERVICE:', process.env.AI_SERVICE);
      console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);
      
      let enhancedPrompt = prompt;
      try {
        // Enhance prompt with RAG (non-critical)
        enhancedPrompt = await RAGService.enhancePromptWithContext(prompt, this.currentGoalId);
        console.log('Successfully enhanced prompt with RAG');
      } catch (ragError) {
        console.warn('RAG enhancement failed, using original prompt:', ragError);
        // Continue with original prompt
      }
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        store: true,
        messages: [
          {
            role: "system",
            content: "You are a professional goal tracking and analysis assistant. Your role is to provide insightful analysis, pattern recognition, and constructive suggestions based on user's goal progress data."
          },
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
      });

      console.log('OpenAI API call successful');
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', {
        error: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  static async _generateHuggingFaceAnalysis(prompt) {
    const result = await hf.textGeneration({
      model: 'gpt2', // or other suitable models
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        do_sample: true
      }
    });

    return result.generated_text;
  }

  static _preparePrompt(goal, progress, analysis, period) {
    const startDateStr = formatISO(period.startDate, { representation: 'date' });
    const endDateStr = formatISO(period.endDate, { representation: 'date' });

    return `
As a professional goal analysis assistant, please generate a detailed analysis report based on the following information:

Goal Information:
Title: ${goal.title}
Current Task: ${goal.currentSettings?.dailyTask || 'None'}
Priority: ${goal.priority || 'Not set'}

Time Range: ${startDateStr} to ${endDateStr}
Progress Data:
- Total Records: ${analysis.totalRecords}
- Completed Tasks: ${analysis.completedTasks}
- Completion Rate: ${analysis.completionRate.toFixed(1)}%

Detailed Records:
${progress.map(p => {
  let record = `- ${formatISO(p.date, { representation: 'date' })}:`;
  if (p.records && p.records.length > 0) {
    record += '\n' + p.records.map(r => 
      `  • ${r.activity} (${r.duration} mins)${r.notes ? ': ' + r.notes : ''}`
    ).join('\n');
  }
  return record;
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
}

export default ReportService;