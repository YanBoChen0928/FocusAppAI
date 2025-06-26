# Implementation Plan: New RAG Feature (Weekly Memo)

## Related Files

- `focus-app/docs/implementation-new_rag_20250625chatgpt.md` (Current file)
- `focus-app/docs/Implementation-20250625_newRAG_implementation_plan.md` (Reference)
- `focus-app/server/models/Report.js` (Model to be modified)
- `focus-app/server/models/Progress.js` (Related model)
- `focus-app/server/services/RAGService.js` (Service to be enhanced)

## Modification History

- 2025/06/25: Initial implementation plan
- 2025/06/25: Added file references and checklist
- 2025/06/25: Format correction and checklist completion
- 2025/06/25: Design conflict analysis and resolution

## Design Conflict Analysis

### 🔴 Identified Conflicts:(solved)

1. **Data Structure Conflict**

   - **Issue**: Section 2.1 proposes adding `memos` array to Report model, but Section 3.1 shows storing direct report fields
   - **Resolution**: Choose one approach - either extend Report model or create separate Memos collection

2. **API Endpoint Inconsistency**

   - **Issue**: Section 2.2 defines `/api/memos/:reportId/*` endpoints, but checklist mentions ReportService for general reports
   - **Resolution**: Clarify if memos are part of reports or separate entities

3. **Storage Logic Duplication**
   - **Issue**: Both Section 3.1 and Phase 1 checklist mention automatic storage, with different implementation details
   - **Resolution**: Consolidate into single ReportService implementation

### 🟡 Design Decisions Needed

1. **Schema Choice**: Report.memos vs separate Memos collection
2. **API Structure**: Memo-specific endpoints vs general report endpoints
3. **Service Layer**: Unified ReportService vs separate MemoService

### ✅ Resolved Design:

## 1. Goals

- **Enable Weekly Memo Workflow**: Let users write an original memo, receive AI-generated suggestions via RAG, and finalize their memo.
- **Phase Tracking**: Record three phases—`originalMemo` (user), `aiDraft` (RAG), and `finalMemo` (user)—with timestamps and optional embeddings.
- **RAG Enhancement**: Leverage historical AI-feedback context to generate more personalized memos.
- **UI/UX Improvements**: Provide timeline view, one-click AI draft acceptance, inline editing, and autosave.
- **Data Retrieval & Search**: Store embeddings for future vector searches of similar memos.

## 2. Execution Steps

### 2.1 Database Schema Updates

- Update **Report** model (`server/models/Report.js`):
  ```js
  memos: [
    {
      phase: String,       // 'originalMemo' | 'aiDraft' | 'finalMemo'
      content: String,
      timestamp: Date,
      embedding?: [Number] // 1536-dimension vector for RAG
    }
  ]
  ```

### 2.2 Backend API Endpoints

1. **POST** `/api/reports/:reportId/memos/suggest`

   - Save `originalMemo` to `memos` array in Report document.
   - Call `RAGService.enhancePrompt({ aiFeedback, originalMemo })`.
   - Call OpenAI (e.g., `gpt-o4-mini`) to generate `aiDraft`.
   - Save `aiDraft` with `embedding` to `memos` array.
   - Return `aiDraft`.

2. **PATCH** `/api/reports/:reportId/memos`

   - Accept `finalMemo` from user.
   - Optionally generate and save its `embedding`.
   - Update `memos` array in Report document.

3. **GET** `/api/reports/:reportId/memos`

   - Retrieve all memo phases for UI from Report document.

### 2.3 RAGService Enhancement

```javascript
/**
 * Enhance prompt with AI feedback and user memo
 * @param {Object} params - Input parameters
 * @param {string} params.aiFeedback - Previous AI feedback
 * @param {string} params.userMemo - User's original memo
 * @returns {Promise<string>} Enhanced prompt
 */
async function enhancePrompt({ aiFeedback, userMemo }) {
  const prompt = `
    AI Feedback:
    ${aiFeedback.content}

    User Memo Draft:
    ${userMemo}

    Please generate a concise, actionable weekly reminder memo.
  `;

  try {
    return await generateEnhancedPrompt(prompt);
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return userMemo; // Fallback to original memo
  }
}
```

### 2.4 Frontend Component

```jsx
/**
 * WeeklyMemo Component
 * Handles memo creation, AI enhancement, and final editing
 */
const WeeklyMemo = () => {
  // State management
  const [originalMemo, setOriginalMemo] = useState("");
  const [aiDraft, setAiDraft] = useState(null);
  const [finalMemo, setFinalMemo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Component implementation:
  // - <textarea> for originalMemo
  // - "AI Suggest" button → POST /api/reports/:reportId/memos/suggest
  // - Editable display for aiDraft with "Accept AI" button
  // - "Save" button → PATCH /api/reports/:reportId/memos
  // - Timeline view showing phases and timestamps
};
```

### 2.5 UI/UX Enhancements

- **One‑Click Accept**: Button to accept `aiDraft` as `finalMemo`
- **Autosave Implementation**
  - Use localStorage for draft storage
  - Implement periodic saving
  - Handle recovery scenarios
- **Loading States**
  - Add loading spinners
  - Implement progress indicators
  - Handle transition states
- **Error Handling**
  - Display user-friendly error messages
  - Implement retry mechanisms
  - Provide fallback options
- **Styling Integration**
  - Use existing design system (Tailwind/CSS module)
  - Maintain consistent UI
  - Ensure responsive design

### 2.6 Testing

- **Unit Tests**:
  - Model schema validations.
  - `RAGService.enhancePrompt` logic.
- **Integration Tests**:
  - `POST /api/reports/:reportId/memos/suggest` and `PATCH /api/reports/:reportId/memos` flows.
- **E2E Tests**:
  - Simulate full user flow: input → AI draft → finalize.
- **DB Verification**:
  - Confirm `memos` entries in MongoDB.

### 2.7 Monitoring & Metrics

- Log usage of `/api/reports/:reportId/memos/suggest` endpoint and response times.
- Track embedding storage success rates in Report documents.
- Gather user feedback on memo feature.

## 3. Feasible Methods & Technologies

- **AI Models**: `gpt-o4-mini` for memo generation; `text-embedding-ada-002` for embeddings.
- **Backend**: Node.js + Express + Mongoose.
- **Frontend**: React Hooks + Axios/apiService; date-fns for timestamps.
- **Storage**: MongoDB vector index for `embedding` field.
- **UI**: Timeline with CSS Grid or lightweight library.

### 3.1 MongoDB Storage Process

```javascript
/**
 * Generate and store AI feedback report
 * @param {string} goalId - Goal ID reference
 * @param {string} userId - User ID reference
 * @param {string} content - Report content
 * @param {Array} insights - AI-generated insights
 * @param {Array} recommendations - AI recommendations
 * @param {Array} embedding - Vector embedding (1536 dimensions)
 */
async function generateAndStoreReport(
  goalId,
  userId,
  content,
  insights,
  recommendations,
  embedding
) {
  const report = new Report({
    goalId,
    userId,
    content,
    insights,
    recommendations,
    embedding,
    createdAt: new Date(),
  });

  try {
    await report.save(); // Save to MongoDB FocusFinalProject.reports collection
    console.log("Report saved successfully:", report);
    return report;
  } catch (error) {
    console.error("Error saving report:", error);
    throw error;
  }
}
```

## 4. Implementation Checklist

### Phase 1: MongoDB Integration (Highest Priority)

- [ ] **Database Schema Updates**
  - [ ] Update Report Model
    - [ ] Add embedding field (1536-dimension vector)
    - [ ] Configure vector index
    - [ ] Add timestamp fields
    - [ ] Implement validation rules
- [ ] **Automatic CRUD Operations**

  - [ ] Create ReportService class
    ```javascript
    class ReportService {
      async saveReport(report, embedding) {
        // Implementation for automatic storage
      }
      async findSimilarReports(embedding) {
        // Implementation for vector search
      }
    }
    ```
  - [ ] Implement automatic AI feedback storage
  - [ ] Add vectorization storage
  - [ ] Implement query and retrieval functions

- [ ] **Data Validation & Error Handling**
  - [ ] Add data validation middleware
  - [ ] Implement error handling mechanisms
  - [ ] Add logging system
  - [ ] Create backup strategies

### Phase 2: RAG Enhancement

- [ ] **Vector Search Implementation**

  - [ ] Configure MongoDB vector index
  - [ ] Implement similarity calculation
  - [ ] Optimize search performance
  - [ ] Add caching mechanism

- [ ] **AI Feedback Enhancement**
  - [ ] Integrate historical data
  - [ ] Optimize prompt generation
  - [ ] Implement dynamic model selection
  - [ ] Add feedback quality metrics

### Phase 3: UI/UX Optimization

- [ ] **New UI Components**

  - [ ] Add feedback editing interface
  - [ ] Implement real-time preview
  - [ ] Add history display
  - [ ] Create export functionality

- [ ] **User Interaction Optimization**
  - [ ] Implement autosave
  - [ ] Add loading states
  - [ ] Optimize error messages
  - [ ] Add user preferences

### Execution Priority

1. **MongoDB Integration (Current Focus)**

   - Essential for data persistence
   - Foundation for RAG functionality
   - Required for all subsequent features

2. **RAG Enhancement**

   - Builds on MongoDB integration
   - Improves AI feedback quality
   - Enables advanced features

3. **UI/UX Optimization**
   - Enhances user experience
   - Adds convenience features
   - Polishes the interface

### Risk Assessment

- **Technical Risks**
  - MongoDB vector search performance
  - Data consistency challenges
  - API response times
- **User Experience Risks**
  - Learning curve for new features
  - System responsiveness
  - Data recovery needs

### Monitoring Metrics

- **Performance Metrics**
  - MongoDB write success rate: >95%
  - Query response time: <3 seconds
  - Cache hit ratio: >80%
- **User Metrics**
  - Feature usage statistics
  - Error occurrence rate
  - User satisfaction scores

### Next Steps

1. Begin with MongoDB integration
2. Set up monitoring system
3. Implement basic RAG features
4. Gradually add UI improvements

---


### 🟡 Design Decisions Needed

1. **Schema Choice**

   - We will extend the existing `Report` model with a `memos` array:
     ```js
     memos: [
       {
         phase: String,       // 'originalMemo' | 'aiDraft' | 'finalMemo'
         content: String,
         timestamp: Date,
         embedding?: [Number]
       }
     ]
     ```
   - Rationale: Keeps memos tightly coupled with their report, reduces cross-collection overhead.

2. **API Structure**

   - Use nested routes under reports:
     - `POST /api/reports/:reportId/memos/suggest`
     - `PATCH /api/reports/:reportId/memos/:memoId`
     - `GET /api/reports/:reportId/memos`
   - Rationale: Follows RESTful best practices and clearly expresses resource hierarchy.

3. **Service Layer**
   - Consolidate all memo-related operations in `ReportService`:
     ```js
     class ReportService {
       async addMemo(reportId, memoContent) {
         /* ... */
       }
       async updateMemo(reportId, memoId, finalContent) {
         /* ... */
       }
       async listMemos(reportId) {
         /* ... */
       }
       // existing methods...
     }
     ```
   - Rationale: Centralizes data logic, while `RAGService` remains focused on prompt enhancement.

## 7. MVP Implementation Details

### 7.1 Report Model Schema Update

**File**: `server/models/Report.js`

Add the following to the existing ReportSchema:

```javascript
// Add memos field to existing ReportSchema
memos: [{
  phase: {
    type: String,
    enum: ['originalMemo', 'aiDraft', 'finalMemo'],
    required: true
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  embedding: {
    type: [Number],
    validate: {
      validator: function(v) {
        return !v || v.length === 1536;
      },
      message: 'Embedding must have exactly 1536 dimensions'
    }
  }
}]

// Add vector index for memos.embedding
ReportSchema.index(
  { "memos.embedding": "vector" },
  {
    name: "memoEmbeddings",
    vectorSearchOptions: {
      numDimensions: 1536,
      similarity: "cosine"
    }
  }
);
```

### 7.2 Basic Error Handling

**API Error Response Format**:
```javascript
// Standard error response structure
const errorResponse = {
  success: false,
  error: {
    code: 'MEMO_SAVE_FAILED',
    message: 'Failed to save memo',
    details: error.message
  }
};
```

**Frontend Error Handling**:
```javascript
// Error handling in React components
const handleApiError = (error) => {
  const message = error.response?.data?.error?.message || 'Something went wrong';
  setError(message);
  
  // Show user-friendly notification
  console.error('API Error:', error);
};

// Usage in memo operations
try {
  const response = await api.post(`/reports/${reportId}/memos/suggest`, data);
  // Handle success
} catch (error) {
  handleApiError(error);
}
```

**Backend Error Handling**:
```javascript
// Middleware for consistent error responses
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};
```
