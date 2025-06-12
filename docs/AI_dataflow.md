# AI Feedback Data Flow Documentation

## Overview

The AI feedback system follows a comprehensive data flow pattern that integrates with MongoDB for both input and output operations.

## Data Flow Architecture

```
┌──────────────┐    1    ┌──────────────┐    2     ┌──────────────┐
│              │─────────►              │──────────►│              │
│  MongoDB     │         │ ReportService│          │   OpenAI     │
│  (Goals)     │         │              │          │   API        │
│              │◄────────│              │◄─────────│              │
└──────────────┘    4    └──────────────┘    3     └──────────────┘
       ▲                        │
       │                        │
       │          5            ▼
┌──────────────┐         ┌──────────────┐
│              │         │              │
│  MongoDB     │◄────────│  Generated   │
│  (Reports)   │         │  Report      │
│              │         │              │
└──────────────┘         └──────────────┘
```

## Process Flow

1. **Data Retrieval (Step 1)**
   - ReportService queries MongoDB for goal information
   - Retrieves goal details and progress records
   - Uses Goal.findById() and Progress.find()

2. **AI Processing (Step 2-3)**
   - Prepares prompt with retrieved data
   - Sends to OpenAI API
   - Receives AI-generated analysis

3. **Data Storage (Step 4-5)**
   - Creates new Report document
   - Stores AI analysis in MongoDB
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

### AI Processing
```javascript
// Prompt preparation and AI call
const prompt = this._preparePrompt(goal, progress, analysis);
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
  isGenerated: true
});

await report.save();
```

## API Endpoints

### Generate Report
- **Endpoint**: POST /api/reports/:goalId
- **Authentication**: Required
- **Flow**: Frontend → Backend → MongoDB → OpenAI → MongoDB → Frontend

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
  type: String,
  period: {
    startDate: Date,
    endDate: Date
  },
  isGenerated: Boolean,
  createdAt: Date
}
```

## Security Considerations

1. Authentication required for all operations
2. Ownership verification before data access
3. Rate limiting implemented
4. Secure API key handling for OpenAI 