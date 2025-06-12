import OpenAI from 'openai';
import Report from '../models/Report.js';
import Progress from '../models/Progress.js';
import Goal from '../models/Goal.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class RAGService {
  static async enhancePromptWithContext(prompt, goalId) {
    try {
      // 1. Generate embedding for current query
      const queryEmbedding = await this._generateEmbedding(prompt);
      
      // 2. Retrieve similar reports from MongoDB
      const similarReports = await Report.aggregate([
        {
          $match: { goalId: goalId }  // Only search within the same goal
        },
        {
          $vectorSearch: {
            queryVector: queryEmbedding,
            path: "embedding",
            numCandidates: 20,
            limit: 5,
            index: "reportEmbeddings",
          }
        }
      ]);

      console.log(`Found ${similarReports.length} similar reports for goal ${goalId}`);

      // 3. Build enhanced prompt
      const enhancedPrompt = `
Previous relevant analyses for this goal:
${similarReports.map(report => `
Date: ${report.createdAt}
Analysis: ${report.content}
---`).join('\n')}

Current analysis request:
${prompt}
      `;

      console.log('Enhanced prompt created with historical context');
      return enhancedPrompt;
    } catch (error) {
      console.error('Error in enhancePromptWithContext:', error);
      // If RAG fails, return original prompt
      return prompt;
    }
  }

  static async _generateEmbedding(text) {
    if (!text) {
      throw new Error('Text is required for embedding generation');
    }

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
        encoding_format: "float"
      });

      if (!response.data?.[0]?.embedding) {
        throw new Error('No embedding received from OpenAI');
      }

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  static async saveReportEmbedding(report) {
    if (!report?._id || !report?.content) {
      console.error('Invalid report for embedding generation');
      return;
    }

    try {
      const embedding = await this._generateEmbedding(report.content);
      
      if (embedding.length !== 1536) {
        throw new Error(`Invalid embedding dimensions: ${embedding.length}`);
      }

      await Report.findByIdAndUpdate(report._id, {
        $set: { embedding: embedding }
      });
      
      console.log(`Report embedding saved successfully for report ${report._id}`);
    } catch (error) {
      console.error('Error saving report embedding:', error);
      // Don't throw error as this is enhancement
    }
  }
}

export default RAGService; 