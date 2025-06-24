# AI Feedback Data Flow Documentation

Related Files:
- `server/services/RAGService.js`
- `server/services/ReportService.js`
- `client/src/components/ProgressReport/AIFeedback.jsx`
- `server/models/Report.js`
- `focus-app/docs/20250624aifeedback_rag_futureFeature.md`

## Update (2025/06/21)
Added new RAG strategy implementation. See `AIFeedBack_RAG.md` for detailed documentation about:
- Time-based RAG activation (21+ days analysis)
- Model selection strategy (GPT-4o-mini (general) vs GPT-o4-mini(RAG))
- Cache optimization strategy

## Overview

The AI feedback system follows a comprehensive data flow pattern that integrates with MongoDB for both input and output operations, enhanced with RAG (Retrieval Augmented Generation) capabilities.

## Model Configuration

### Text Generation Models
```javascript
// Basic Analysis
model: "gpt-4o-mini"
temperature: 0.7
max_tokens: 500

// Deep Analysis (RAG)
model: "gpt-o4-mini"
temperature: 0.7
max_tokens: 500
```

### Embedding Model
```javascript
model: "text-embedding-ada-002"
encoding_format: "float"
dimensions: 1536
```

## Vector Store Configuration

### MongoDB Vector Store Implementation
- **Model**: text-embedding-ada-002
- **Dimensions**: 1536
- **Distance Metric**: cosine similarity
- **Index Type**: vectorSearch
- **Storage**: MongoDB Atlas

### MongoDB Vector Search Configuration
```javascript
// Vector Search Index Configuration
{
  name: "reportEmbeddings",
  type: "vectorSearch",
  fields: [{
    numDimensions: 1536,
    path: "embedding",
    similarity: "cosine",
    type: "vector"
  }]
}
```

## Data Flow Architecture

```
┌──────────────┐    1    ┌──────────────┐    2     ┌──────────────┐
│              │─────────►              │──────────►│              │
│  MongoDB     │         │ ReportService│          │ Vector Store │
│  (Goals)     │         │              │          │              │
│              │◄────────│              │◄─────────│              │
└──────────────┘    4    └──────────────┘    3     └──────────────┘
       ▲                        │                          │
       │                        │                          │
       │          6            ▼              5           ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  MongoDB     │◄────────│  Generated   │◄────────│   OpenAI     │
│  (Reports)   │         │  Report      │         │     API      │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Process Flow

1. **Data Retrieval (Step 1)**
   - ReportService queries MongoDB for goal information
   - Retrieves goal details and progress records
   - Uses Goal.findById() and Progress.find()

2. **Vector Search (Step 2-3)**
   - Converts query into embeddings
   - Searches vector store for similar historical reports
   - Retrieves relevant past analyses

3. **AI Processing (Step 4-5)**
   - Prepares enhanced prompt with:
     - Retrieved data
     - Similar historical reports
     - Context from vector store
   - Sends to OpenAI API
   - Receives AI-generated analysis

4. **Data Storage (Step 6)**
   - Creates new Report document
   - Stores AI analysis in MongoDB
   - Updates vector store with new report
   - Links report to original goal

## Implementation Details

### Input Data Collection
```javascript
// From ReportService.js
const goal = await Goal.findById(goalId);
const progress = await Progress.find({
  goalId,
  date: {
    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
    $lt: new Date(new Date().setHours(23, 59, 59, 999))
  }
});
```

### Vector Search
```javascript
// Vector search implementation
const embedding = await generateEmbedding(query);
const similarReports = await vectorStore.search(embedding);
```

### AI Processing
```javascript
// Enhanced prompt preparation with RAG
const context = await prepareContext(goal, progress, similarReports);
const prompt = this._preparePrompt(context);
const aiAnalysis = await this._generateAIAnalysis(prompt);
```

### Report Storage
```javascript
// Report creation and storage
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
  isGenerated: true,
  vectorEmbedding: await generateEmbedding(aiAnalysis)
});

// Save to MongoDB
await report.save();

// Update vector store
await vectorStore.upsert({
  id: report._id,
  embedding: report.vectorEmbedding,
  content: aiAnalysis
});
```

### OpenAI Models Used
```javascript
// For text generation
model: "gpt-4o-mini"
temperature: 0.7
max_tokens: 500

// For embeddings
model: ""
encoding_format: "float"
```

### RAG Service Implementation
```javascript
class RAGService {
  static async enhancePromptWithContext(prompt, goalId) {
    try {
      // 1. Generate embedding for current query
      const queryEmbedding = await this._generateEmbedding(prompt);
      
      // 2. Retrieve similar reports from MongoDB
      const similarReports = await Report.aggregate([
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

      // 3. Build enhanced prompt with historical context
      const enhancedPrompt = `
Previous relevant analyses:
${similarReports.map(report => `
Date: ${report.createdAt}
Analysis: ${report.content}
---`).join('\n')}

Current analysis request:
${prompt}
      `;

      return enhancedPrompt;
    } catch (error) {
      // Fallback to original prompt if RAG fails
      return prompt;
    }
  }

  static async saveReportEmbedding(report) {
    const embedding = await this._generateEmbedding(report.content);
    await Report.findByIdAndUpdate(report._id, {
      $set: { embedding: embedding }
    });
  }
}
```

### MongoDB Vector Search Configuration
```javascript
// Report Schema Vector Field
embedding: {
  type: [Number],
  sparse: true,
  index: true,
  description: "Vector embedding for RAG functionality"
}

// Vector Search Index
{
  name: "reportEmbeddings",
  vectorSearchOptions: {
    numDimensions: 1536,  // text-embedding-ada-002 dimensions
    similarity: "cosine"
  }
}
```

### Verification Steps

1. **MongoDB Atlas Verification**
- Check Reports collection
- Verify embedding field exists
- Confirm vector index is created

2. **Postman Testing**
```http
POST http://localhost:3000/api/reports/:goalId
Authorization: Bearer <your-token>

Response should include:
{
  "success": true,
  "data": {
    "content": "...",
    "embedding": [...],  // 1536-dimension vector
    ...
  }
}
```

3. **Browser Network Inspection**
- Check Network tab in Developer Tools
- Verify RAG-enhanced response content
- Monitor console logs for:
  ```
  Found similar reports: X
  Enhanced prompt created with historical context
  ```

## API Endpoints

### Generate Report
- **Endpoint**: POST /api/reports/:goalId
- **Authentication**: Required
- **Flow**: Frontend → Backend → MongoDB → Vector Store → OpenAI → MongoDB → Frontend

### Get Latest Report
- **Endpoint**: GET /api/reports/:goalId/latest
- **Authentication**: Required
- **Flow**: Frontend → Backend → MongoDB → Frontend

## Data Models

### Report Schema
```javascript
{
  goalId: ObjectId,
  userId: String,
  content: String,    // AI-generated analysis
  analysis: {
    totalRecords: Number,
    completedTasks: Number,
    completionRate: Number,
    lastUpdate: Date
  },
  vectorEmbedding: Array,  // New field for RAG
  type: String,
  period: {
    startDate: Date,
    endDate: Date
  },
  isGenerated: Boolean,
  createdAt: Date
}
```

## User Interaction and RAG Implementation (Update 2025/06/24)

### UI Components
```javascript
// client/src/components/ProgressReport/AIFeedback.jsx
const AIFeedbackDetail = ({ feedback }) => {
  const [userEditedText, setUserEditedText] = useState(feedback.content);
  const [isRAGDialogOpen, setIsRAGDialogOpen] = useState(false);
  
  return (
    <div className="feedback-section">
      {/* Inline Editing */}
      <div className="edit-section">
        <button className="edit-button">
          <span>✏️ Edit</span>
        </button>
        <textarea
          value={userEditedText}
          onChange={(e) => setUserEditedText(e.target.value)}
          onBlur={handleInlineEdit}
        />
      </div>

      {/* RAG Dialog Trigger */}
      <button 
        className="rag-button"
        onClick={() => setIsRAGDialogOpen(true)}
      >
        <span>💬 Refine with AI</span>
      </button>

      {/* RAG Dialog */}
      <Dialog open={isRAGDialogOpen}>
        <RAGDialogContent feedback={feedback} />
      </Dialog>
    </div>
  );
};
```

### RAG Interaction Flow
```javascript
const RAGDialogContent = ({ feedback }) => {
  const handleRAGQuery = async (query) => {
    // Only generate embeddings during RAG interaction
    const response = await api.post('/api/feedback/rag-query', {
      feedbackId: feedback.id,
      query,
      userRequestedRAG: true  // Explicit RAG request
    });
    return response.data;
  };
};
```

### Embedding Generation Strategy
```javascript
// server/services/RAGService.js
class RAGService {
  static async handleUserInteraction(feedbackId, type, content) {
    switch (type) {
      case 'inline-edit':
        // No embedding generation for inline edits
        await this.saveUserEdit(feedbackId, content);
        break;
      
      case 'rag-query':
        // Generate embeddings only for RAG interactions
        const embedding = await this.generateEmbedding(content);
        const enhancedPrompt = await this.enhancePromptWithContext(
          content,
          embedding
        );
        return this.generateRAGResponse(enhancedPrompt);
    }
  }
}
```

### Data Storage Schema
```javascript
// Extended Report Schema
{
  // ... existing fields ...
  userEdits: [{
    content: String,
    timestamp: Date,
    type: String // 'inline' or 'rag'
  }],
  ragInteractions: [{
    query: String,
    response: String,
    timestamp: Date,
    embedding: Array // Only stored for RAG queries
  }]
}
```

## RAG Implementation Details

### Error Handling and Fallbacks
```javascript
// RAG enhancement with fallback
try {
  enhancedPrompt = await RAGService.enhancePromptWithContext(prompt, goalId);
  console.log('Successfully enhanced prompt with RAG');
} catch (ragError) {
  console.warn('RAG enhancement failed, using original prompt:', ragError);
  // Continue with original prompt
}

// Embedding storage with validation
if (embedding.length !== 1536) {
  throw new Error(`Invalid embedding dimensions: ${embedding.length}`);
}
```

### Vector Search Implementation
```javascript
// MongoDB aggregation with vector search
const similarReports = await Report.aggregate([
  {
    $match: { goalId: goalId }  // Scope to current goal
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
```

### Enhanced Prompt Structure
```javascript
const enhancedPrompt = `
Previous relevant analyses for this goal:
${similarReports.map(report => `
Date: ${report.createdAt}
Analysis: ${report.content}
---`).join('\n')}

Current analysis request:
${prompt}
`;
```

## Verification Methods

### 1. MongoDB Data Verification
```javascript
// Check Report Document Structure
{
  _id: ObjectId("..."),
  content: "Analysis text...",
  embedding: [0.123, ...], // Should be 1536 numbers
  goalId: ObjectId("..."),
  createdAt: ISODate("...")
}

// Verify Vector Index
{
  name: "reportEmbeddings",
  type: "vectorSearch",
  properties: {
    numDimensions: 1536,
    similarity: "cosine"
  }
}
```

### 2. Console Logging Verification
Look for these log messages in browser console:
```javascript
// Success Path
"Found X similar reports for goal [goalId]"
"Enhanced prompt created with historical context"
"Report embedding saved successfully for report [reportId]"

// Fallback Path
"RAG enhancement failed, using original prompt: [error]"
"Failed to save report embedding: [error]"
```

### 3. Response Content Verification
1. First Report Generation:
   - Response will not contain historical context
   - Check MongoDB for embedding field

2. Subsequent Reports:
   - Response should reference previous analyses
   - Look for patterns like:
     ```
     "As previously observed..."
     "Similar to your last report..."
     "Continuing the trend from..."
     ```

### 4. Performance Impact
Monitor response times:
- First generation: ~2-3 seconds
- With RAG: ~3-4 seconds
- If significantly longer, check:
  - Vector search performance
  - Embedding generation time
  - MongoDB index efficiency
```

## Future Features

### Interactive User Feedback Flow
```
┌──────────────┐    1    ┌──────────────┐    2    ┌──────────────┐
│              │─────────►              │─────────►│              │
│   User       │         │  Frontend    │         │   Backend    │
│  Interface   │         │  (React)     │         │   (Node.js)  │
│              │◄────────│              │◄────────│              │
└──────────────┘    4    └──────────────┘    3    └──────────────┘
                                                         │
                                                         │
                                              5          ▼
                                             ┌──────────────┐
                                             │              │
                                             │   OpenAI     │
                                             │     API      │
                                             │              │
                                             └──────────────┘
```

### Implementation Details

1. **User Input Handler**
```javascript
// client/src/components/ProgressReport/AIFeedback.jsx
const handleUserQuery = async (feedbackId, userQuery) => {
  const context = {
    originalFeedback: feedback.content,
    userQuery: userQuery,
    feedbackId: feedbackId
  };
  
  const response = await api.post('/api/feedback/query', context);
  return response.data;
};
```

2. **Backend Processing**
```javascript
// server/services/AIService.js
class AIService {
  static async processUserQuery(context) {
    const prompt = `
Based on the original feedback:
${context.originalFeedback}

User's question:
${context.userQuery}

Please provide a detailed response that:
1. Directly addresses the user's question
2. References relevant parts of the original feedback
3. Provides specific, actionable insights
4. Maintains consistency with previous recommendations
`;

    const completion = await openai.chat.completions.create({
      model: isDeepAnalysis ? "gpt-o4-mini" : "gpt-4o-mini",  // Updated model selection
      messages: [
        { role: "system", content: "You are a goal-oriented AI assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  }
}
```

### API Updates

1. **New Endpoint**
```javascript
// server/routes/feedback.js
router.post('/query', auth, async (req, res) => {
  try {
    const response = await AIService.processUserQuery(req.body);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

2. **Frontend Integration**
```javascript
// client/src/components/ProgressReport/AIFeedback.jsx
const AIFeedbackDetail = ({ feedback }) => {
  const [userQuery, setUserQuery] = useState('');
  const [detailedResponse, setDetailedResponse] = useState(null);

  const handleQuerySubmit = async () => {
    const response = await handleUserQuery(feedback.id, userQuery);
    setDetailedResponse(response);
  };

  return (
    <div>
      <textarea
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        placeholder="Ask for more details about this feedback..."
      />
      <button onClick={handleQuerySubmit}>Get Details</button>
      {detailedResponse && (
        <div className="detailed-response">
          {detailedResponse}
        </div>
      )}
    </div>
  );
};
```

### OpenAI Service Migration

Previous Hugging Face implementation has been replaced with OpenAI:

```javascript
// server/services/AIService.js
class AIService {
  static async generateAnalysis(prompt) {
    try {
      const completion = await openai.chat.completions.create({
        model: isDeepAnalysis ? "gpt-o4-mini" : "gpt-4o-mini",  // Updated model selection
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

  static async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",  // Updated embedding model
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  }
}

export default AIService;
```