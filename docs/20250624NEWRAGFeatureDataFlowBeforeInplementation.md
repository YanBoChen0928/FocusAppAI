# AI Feedback RAG Feature Data Flow Documentation

Related Files:
- `server/services/RAGService.js`
- `server/services/ReportService.js`
- `client/src/components/ProgressReport/AIFeedback.jsx`
- `server/models/Report.js`
- `focus-app/docs/20250624aifeedback_rag_futureFeature.md`
- `focus-app/docs/20250624Update_AI_dataflow.md`

## 1. AI Report Generation and Storage Flow

```
┌──────────────┐     1      ┌──────────────┐     2      ┌──────────────┐
│    Goal &    │────────────►              │────────────►              │
│   Progress   │            │ ReportService │            │   OpenAI     │
│    Data      │            │              │            │     API      │
└──────────────┘            └──────────────┘            └──────────────┘
                                   │                           │
                                   │                           │
                                   │                           │
                                   │         3                 ▼
                                   │                    ┌──────────────┐
                                   │                    │  Generated   │
                                   │                    │ AI Analysis  │
                                   │                    └──────────────┘
                                   │                           │
                                   │                           │
                                   ▼           4              ▼
                            ┌──────────────┐          ┌──────────────┐
                            │   Original   │          │   Vector     │
                            │   Content    │──────────►  Embedding   │
                            │  (MongoDB)   │    5     │  (MongoDB)   │
                            └──────────────┘          └──────────────┘
```

Flow Description:
1. System retrieves Goal and Progress data from MongoDB
2. ReportService calls OpenAI API to generate AI analysis report
3. OpenAI returns the generated AI analysis content
4. Store original AI analysis content in MongoDB's content field
5. Simultaneously generate vector using text-embedding-ada-002 model and store in vectorEmbedding field

## 2. RAG Deep Analysis Flow

```
┌──────────────┐     1      ┌──────────────┐     2      ┌──────────────┐
│    User      │────────────►              │────────────►              │
│   Query      │            │ RAGService   │            │   OpenAI     │
│              │            │              │            │ Embeddings   │
└──────────────┘            └──────────────┘            └──────────────┘
                                   │                           │
                                   │         3                 │
                                   ▼                          ▼
                            ┌──────────────┐          ┌──────────────┐
                            │   Vector     │◄─────────┘   Query      │
                            │   Search     │             Embedding   │
                            │  (MongoDB)   │                         │
                            └──────────────┘                         │
                                   │                                 │
                                   │         4                       │
                                   ▼                                 │
                            ┌──────────────┐                        │
                            │  Similar     │                        │
                            │  Reports     │                        │
                            └──────────────┘                        │
                                   │                                │
                                   │         5                      │
                                   ▼                                │
                            ┌──────────────┐            6          │
                            │  Enhanced    │◄───────────────────────┘
                            │   Prompt     │
                            └──────────────┘
                                   │
                                   │         7
                                   ▼
                            ┌──────────────┐
                            │    Final     │
                            │  Response    │
                            └──────────────┘
```

Flow Description:
1. User initiates deep analysis query
2. RAGService calls OpenAI to generate query vector embedding
3. Perform vector search in MongoDB
4. Retrieve similar historical reports
5. Generate enhanced prompt
6. Combine query vector with historical context
7. Generate final deep analysis response

## Data Storage Structure

### MongoDB Report Schema
```javascript
{
  _id: ObjectId,
  goalId: ObjectId,
  content: String,        // Original AI analysis content
  vectorEmbedding: Array, // 1536-dimensional vector
  analysis: {
    totalRecords: Number,
    completedTasks: Number,
    completionRate: Number,
    lastUpdate: Date
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  createdAt: Date
}
```

### Vector Store Configuration
```javascript
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

## Key Timing Points

1. **Vector Generation and Storage Timing**:
   - Occurs immediately after AI report generation
   - Stored simultaneously with original content in MongoDB
   - No need to wait for user to trigger RAG dialogue

2. **Vector Retrieval Timing**:
   - Only performed when user requests RAG deep analysis
   - No vector operations involved during normal report viewing

3. **Data Update Timing**:
   - Vector automatically updated when original content is updated
   - RAG dialogue does not modify stored vectors 