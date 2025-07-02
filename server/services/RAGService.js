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

// Cache embeddings for 1 hour by default, 24 hours for deep analysis
const embeddingCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

class RAGService {
  /**
   * Generate embedding for text content
   * @param {string} content - Text content
   * @returns {Promise<Array>} Embedding vector
   */
  static async _generateEmbedding(content) {
    try {
      console.time('[RAG] Embedding generation');
      console.log('[RAG] Generating embedding for content length:', content.length);

      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: content,
        encoding_format: "float"
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('No embedding received from OpenAI');
      }

      console.timeEnd('[RAG] Embedding generation');
      return response.data[0].embedding;
    } catch (error) {
      console.error('[RAG] Failed to generate embedding:', error);
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
      console.time('[RAG] Context retrieval');
      
      // Get relevant historical reports
      const relevantReports = await this._getRelevantReports(goalId);
      
      console.log('[RAG] Retrieved relevant reports:', relevantReports.length);
      
      if (!relevantReports.length) {
        console.warn('[RAG] No relevant historical context found for goal:', goalId);
        return basePrompt;
      }

      // Extract key insights from historical reports
      const historicalContext = this._extractKeyInsights(relevantReports);
      console.log('[RAG] Historical context length:', historicalContext.length);

      // Combine with base prompt
      const enhancedPrompt = this._combinePrompts(basePrompt, historicalContext);
      console.log('[RAG] Enhanced prompt length:', enhancedPrompt.length);

      console.timeEnd('[RAG] Context retrieval');
      return enhancedPrompt;
    } catch (error) {
      console.error('[RAG] Context retrieval failed:', {
        error,
        goalId,
        stage: 'enhancePromptWithContext'
      });
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
      console.time('[RAG] Save embedding');
      
      // Generate embedding
      const embedding = await this._generateEmbedding(report.content);
      
      // Update report with embedding
      await Report.findByIdAndUpdate(report._id, {
        $set: {
          embedding: embedding,
          hasEmbedding: true
        }
      });

      // Cache the embedding with extended TTL for deep analysis
      const cacheTTL = report.analysisType === 'deep' ? 86400 : 3600; // 24h for deep, 1h for basic
      embeddingCache.set(`embedding:${report._id}`, embedding, cacheTTL);

      console.log('[RAG] Cache status:', {
        hitRate: embeddingCache.getStats().hitRate,
        keys: embeddingCache.getStats().keys
      });

      console.timeEnd('[RAG] Save embedding');
    } catch (error) {
      console.error('[RAG] Failed to save report embedding:', error);
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

      // Log cache performance
      console.log('[RAG] Cache performance:', {
        hitRate: embeddingCache.getStats().hitRate,
        keys: embeddingCache.getStats().keys
      });

      return reports;
    } catch (error) {
      console.error('[RAG] Failed to get relevant reports:', {
        error,
        goalId,
        stage: '_getRelevantReports'
      });
      return [];
    }
  }

  /**
   * Extract key insights from historical reports
   * @param {Array} reports - Historical reports
   * @returns {string} Extracted insights
   */
  static _extractKeyInsights(reports) {
    try {
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
    } catch (error) {
      console.error('[RAG] Failed to extract insights:', error);
      return '';
    }
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