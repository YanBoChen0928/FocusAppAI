/**
 * RAG (Retrieval Augmented Generation) Service
 * Handles context-aware AI analysis by retrieving and incorporating relevant historical data
 */

import OpenAI from 'openai';
import Report from '../models/Report.js';
import NodeCache from 'node-cache';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Cache embeddings for 1 hour
const embeddingCache = new NodeCache({ stdTTL: 3600 });

class RAGService {
  /**
   * Generate embedding for text content
   * @param {string} content - Text content
   * @returns {Promise<Array>} Embedding vector
   */
  static async _generateEmbedding(content) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: content,
        encoding_format: "float"
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('No embedding received from OpenAI');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Enhance prompt with relevant historical context
   * @param {string} basePrompt - Original prompt
   * @param {string} goalId - Goal ID to get relevant context
   * @returns {Promise<string>} Enhanced prompt with context
   */
  static async enhancePromptWithContext(basePrompt, goalId) {
    try {
      // Get relevant historical reports
      const relevantReports = await this._getRelevantReports(goalId);
      
      if (!relevantReports.length) {
        console.log('No relevant historical context found');
        return basePrompt;
      }

      // Extract key insights from historical reports
      const historicalContext = this._extractKeyInsights(relevantReports);

      // Combine with base prompt
      return this._combinePrompts(basePrompt, historicalContext);
    } catch (error) {
      console.error('Failed to enhance prompt with RAG:', error);
      return basePrompt; // Fallback to base prompt
    }
  }

  /**
   * Save report embedding for future retrieval
   * @param {Object} report - Report document
   * @returns {Promise<void>}
   */
  static async saveReportEmbedding(report) {
    try {
      const embedding = await this._generateEmbedding(report.content);
      
      // Update report with embedding
      await Report.findByIdAndUpdate(report._id, {
        $set: {
          embedding: embedding,
          hasEmbedding: true
        }
      });

      // Cache the embedding
      embeddingCache.set(`embedding:${report._id}`, embedding);
    } catch (error) {
      console.error('Failed to save report embedding:', error);
      throw error;
    }
  }

  /**
   * Get relevant historical reports based on semantic similarity
   * @param {string} goalId - Goal ID
   * @returns {Promise<Array>} Relevant reports
   */
  static async _getRelevantReports(goalId) {
    try {
      // Get reports with embeddings
      const reports = await Report.find({
        goalId,
        hasEmbedding: true
      })
      .sort({ createdAt: -1 })
      .limit(10); // Get last 10 reports

      return reports;
    } catch (error) {
      console.error('Failed to get relevant reports:', error);
      return [];
    }
  }

  /**
   * Extract key insights from historical reports
   * @param {Array} reports - Historical reports
   * @returns {string} Extracted insights
   */
  static _extractKeyInsights(reports) {
    const insights = reports.map(report => {
      const content = typeof report.content === 'string' 
        ? JSON.parse(report.content) 
        : report.content;

      return {
        date: report.createdAt,
        completionRate: report.analysis.completionRate,
        keyPoints: content.sections
          ?.filter(s => s.title.includes('Key') || s.title.includes('Pattern'))
          ?.map(s => s.content)
          ?.join('\n') || ''
      };
    });

    return this._formatInsights(insights);
  }

  /**
   * Format insights into a structured string
   * @param {Array} insights - Extracted insights
   * @returns {string} Formatted insights
   */
  static _formatInsights(insights) {
    return `
Historical Context:
${insights.map(insight => `
Date: ${new Date(insight.date).toISOString().split('T')[0]}
Completion Rate: ${insight.completionRate.toFixed(1)}%
Key Points:
${insight.keyPoints}
`).join('\n')}
    `.trim();
  }

  /**
   * Combine base prompt with historical context
   * @param {string} basePrompt - Original prompt
   * @param {string} historicalContext - Historical context
   * @returns {string} Combined prompt
   */
  static _combinePrompts(basePrompt, historicalContext) {
    return `
${basePrompt}

Consider the following historical context when providing analysis:
${historicalContext}

Please incorporate relevant historical patterns and trends in your analysis while maintaining focus on the current time period.
    `.trim();
  }
}

export default RAGService; 