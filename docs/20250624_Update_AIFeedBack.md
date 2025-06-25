# AI Feedback System Optimization Design

## Related Files
- `server/services/RAGService.js`: Core RAG functionality implementation
- `server/services/ReportService.js`: Report generation and analysis
- `client/src/components/ProgressReport/AIFeedback.jsx`: Frontend feedback display
- `server/models/Report.js`: Data model for reports and embeddings
- `server/config/ai-service.js`: AI service configuration
- `server/services/AIService.js`: OpenAI integration service

## Update History
- 2025/06/24: Updated with enhanced UI components and OpenAI service configuration
- 2025/06/21: Initial documentation of new RAG strategy

## Update (2025/06/21)
New RAG strategy has been documented in `AIFeedBack_RAG.md`, including:
- Conditional RAG activation based on analysis timeframe
- Dual model strategy (GPT-3.5 for daily, GPT-4 for deep analysis)
- Enhanced caching strategy
For detailed implementation, please refer to the new document.

Implementation Files:

- `server/services/RAGService.js`: Core RAG functionality implementation
- `server/services/ReportService.js`: Report generation and analysis
- `client/src/components/ProgressReport/AIFeedback.jsx`: Frontend feedback display
- `server/models/Report.js`: Data model for reports and embeddings

## I. Token Optimization and Data Analysis

### 1. Current Data Structure

- Daily goal progress records
- Support for multiple time ranges: 7 days, 30 days, custom time periods
- Detailed daily task completion status

### 2. Optimized Prompt Structure

```javascript
const optimizedPrompt = `
Analysis Period: ${startDate} to ${endDate}

Goal Basic Information:
- Title: ${goal.title}
- Current Task: ${goal.currentSettings?.dailyTask}

Statistical Data:
1. Time Investment Analysis:
   - Total Time Invested: ${totalTime} hours
   - Main Activity Distribution: ${activityDistribution}
   - Peak Time Patterns: ${peakTimePatterns}

2. Task Completion Status:
   - Completion Rate: ${completionRate}%
   - Consecutive Days: ${consecutiveDays}
   - Incomplete Dates: ${incompleteDates}

Please provide analysis in the following format:
1. Major contributing activities during the period
2. Daily task completion status
3. Strengths and Weaknesses Analysis:
   - Strengths (max 3 points)
   - Areas for improvement (max 2 points)
4. Specific improvement suggestions (max 2 points)
5. Encouraging feedback (one sentence)

Note: Keep it concise and specific, each suggestion should not exceed 20 words.
`;
```

### 3. Token Optimization Strategy

1. **Data Preprocessing**:

   - Pre-calculate statistics on the backend
   - Only transmit necessary summary information to AI
   - Use fixed format templates to reduce descriptive text

2. **Response Format Standardization**:
   - Limit output length for each section
   - Use structured output format
   - Avoid lengthy descriptive language

## II. Interactive Feedback Design

### 1. Basic Feedback Storage

```javascript
// Implementation: server/models/Report.js
const feedbackSchema = {
  goalId: ObjectId,
  timeRange: {
    start: Date,
    end: Date,
  },
  analysis: {
    mainActivities: [String],
    completionStatus: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    encouragement: String,
  },
  userInteractions: [
    {
      type: String, // 'question', 'clarification', 'followup'
      content: String,
      aiResponse: String,
      timestamp: Date,
    },
  ],
};
```

### 2. RAG Usage Scenarios and Current Implementation

1. **Current Implementation Status**:

   - Using OpenAI for embeddings (`RAGService.js`)
   - Using Hugging Face's gpt2 for text generation (`ReportService.js`)
   - Dual API calls for each report generation

2. **Scenarios Not Requiring RAG** (`ReportService.js`):

   - Daily progress report generation
   - Basic statistical data analysis
   - Standardized suggestion generation

3. **Recommended RAG Usage Scenarios** (`RAGService.js`):
   - When users ask in-depth questions
   - When referencing historical suggestion continuity
   - Analyzing long-term behavior pattern changes

### 3. Interactive Feedback Flow

1. **Initial Feedback**:

   - Use optimized standard prompt
   - Generate directly from current data without RAG

2. **In-depth Dialogue**:

   - Users select specific feedback points for discussion
   - Enable RAG to retrieve relevant historical context
   - Generate more personalized suggestions

3. **Feedback Optimization Loop**:
   - Record user interactions
   - Update user preferences
   - Optimize future feedback

## III. Implementation Guidelines

## III. Implementation Guidelines

### 1. Frontend Implementation

### 1. Frontend Implementation

```javascript
// Implementation: client/src/components/ProgressReport/AIFeedback.jsx
const AIFeedback = () => {
  // Basic feedback display
  // Basic feedback display
  const [feedback, setFeedback] = useState(null);
  // Deep dive discussion state
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  // RAG usage indicator
  const [isUsingRAG, setIsUsingRAG] = useState(false);

  // Handle deep dive discussion
  const handleDeepDive = async (topic) => {
    // Enable RAG here
    const detailedResponse = await getDetailedFeedback(topic, feedback.id);
    setActiveDiscussion(detailedResponse);
  };

  // Get feedback
  const getFeedback = async () => {
    setIsUsingRAG(false);
    try {
      const response = await api.getAIFeedback(goalId);
      setIsUsingRAG(response.usedRAG);
      setFeedback(response.feedback);
    } catch (error) {
      console.error("Failed to get feedback:", error);
    }
  };

  return (
    <div>
      {isUsingRAG && (
        <div className="rag-indicator">
          <span>🔍 Using Historical Data Enhanced Analysis</span>
        </div>
      )}
      {/* Other feedback content */}
    </div>
  );
};
```

### 2. Backend Implementation

1. **Basic Feedback Generation**:

   - Use optimized prompt
   - Preprocess data
   - Standardize output

2. **In-depth Dialogue Processing**:
   - Use RAG for context enhancement
   - Save conversation history
   - Update user model

### 3. Data Storage Strategy

1. **Short-term Data**:

   - Basic feedback content
   - Statistical data
   - Current conversation context

2. **Long-term Data**:
   - User preferences
   - Behavior patterns
   - Improvement effect tracking

## IV. Important Notes

1. Keep feedback concise and clear
2. Ensure suggestions are actionable
3. Maintain data privacy protection
4. Optimize storage space usage
5. Monitor token usage
6. Maintain timezone consistency
7. Follow date handling standards in DealWithTimeZone.md

## V. MongoDB Storage Implementation

### 1. Report Storage Structure

```javascript
// Already implemented in Report.js
{
  embedding: [Number],     // RAG vector embedding
  analysis: {
    mainActivities: [String],
    completionStatus: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    encouragement: String
  },
  metrics: {
    totalDuration: Number,
    completedCheckpoints: Number,
    totalSessions: Number
  }
}
```

### 2. Storage Strategy

1. **Base Report Storage**:

   - Store basic report content and metrics
   - Always save embeddings for future RAG use
   - Include timezone-aware timestamps

2. **Analysis Storage**:

   - Store detailed analysis in analysis object
   - Keep track of RAG usage in metadata
   - Maintain historical pattern data

3. **Optimization Considerations**:
   - Use sparse indexes for embeddings
   - Implement TTL for old reports
   - Cache frequently accessed patterns

### 3. Implementation Status

✅ **Completed**:

- Report Schema with embedding support
- Basic MongoDB integration
- Vector search index setup
- RAG service integration

⚠️ **Needs Update**:

1. ReportService.js:

   - RAG trigger logic
   - Weekly average calculation
   - Pattern detection
   - Timezone handling

2. Additional Components:
   - AIFeedback.jsx: RAG indicator
   - RAGService.js: Context enhancement
   - API endpoints for deep-dive analysis

### 4. Data Retention Policy

1. **Short-term Storage**:

   - Keep full report content: 30 days
   - Keep embeddings: 90 days
   - Keep basic metrics: 180 days

2. **Long-term Storage**:
   - Aggregate statistics
   - Pattern summaries
   - User preference data

### 5. Performance Considerations

1. **Index Optimization**:

   - Compound index for date-based queries
   - Text index for content search
   - Vector index for embeddings

2. **Query Optimization**:
   - Use projection to limit field retrieval
   - Implement pagination for large datasets
   - Cache frequently accessed reports

## VI. Next Steps

1. Implement TTL indexes for data retention
2. Add monitoring for storage usage
3. Optimize query patterns
4. Set up backup strategy

## VII. Implementation Details

### 1. Files to Update

1. **ReportService.js**:

   - RAG trigger logic
   - Data analysis capabilities
   - Pattern detection
   - Integration with other services

2. **RAGService.js**:

   - Context enhancement
   - Semantic search
   - Embedding management

3. **AIFeedback.jsx**:

   - Frontend display
   - User interaction handling
   - Real-time feedback

4. **Report.js**:
   - TTL indexes
   - Performance optimization
   - Data structure updates

### 2. MongoDB Storage Strategy

We will store analysis reports in MongoDB for:

- Future RAG analysis capabilities
- Long-term user progress tracking
- Pattern recognition
- Suggestion quality optimization

### 3. Implementation Priority

1. ReportService.js updates (core functionality)
2. RAG functionality verification
3. Data storage and retrieval implementation
4. Frontend display integration
5. Performance optimization

## IV. Key Considerations

1. Keep feedback concise and clear
2. Ensure suggestions are actionable
3. Maintain data privacy protection
4. Optimize storage space usage
5. Monitor token usage

## V. API Usage Optimization

### 1. Current API Usage Status

- Default use of OpenAI as main output model
- Simultaneous use of Hugging Face's gpt2 model for local text generation
- OpenAI API used for:
  - Generating text embeddings for similarity search
  - Saving embeddings to database

### 2. API Call Optimization Solutions

1. **Model Selection Optimization**

   - Implement model selection configuration
   - Support switching between OpenAI and Hugging Face
   - Choose appropriate model based on requirements

2. **Embedding Service Optimization**

   - Implement embedding service configuration
   - Provide multiple embedding options:
     - OpenAI Embeddings
     - Hugging Face Embeddings
     - Local embedding models

3. **Caching Strategy**
   - Implement embedding cache
   - Cache frequently used query results
   - Reduce duplicate API calls

### 3. Implementation Plan

1. **Configuration Updates**

   ```javascript
   // config/ai-service.js
   const aiConfig = {
     defaultModel: "huggingface", // or 'openai'
     embeddingService: "huggingface", // or 'openai', 'local'
     cacheEnabled: true,
     cacheTTL: 86400, // 24 hours
   };
   ```

2. **Service Layer Updates**

   - Update RAGService.js
   - Update ReportService.js
   - Implement caching service

3. **Monitoring Implementation**
   - API call counting
   - Response time monitoring
   - Cost tracking

### 4. Monitoring Metrics

1. **API Usage Metrics**

   - Daily call count
   - Average response time
   - Error rate

2. **Cost Metrics**

   - Daily API cost
   - Cost by service
   - Cost optimization suggestions

3. **Performance Metrics**
   - Cache hit rate
   - Average processing time
   - System resource usage

### 5. Expected Results

1. **Cost Optimization**

   - Reduce OpenAI API calls by 50%
   - Optimize embedding service usage
   - Improve cache utilization

2. **Performance Improvement**

   - Reduce average response time
   - Improve system stability
   - Optimize resource usage

3. **Maintainability**
   - More flexible configuration options
   - Better monitoring capabilities
   - Easier problem diagnosis

## VI. Implementation Files Overview

### Core Implementation Files

1. **ReportService.js**

   - RAG trigger logic implementation
   - Data analysis and pattern detection
   - Time-zone aware processing
   - Integration with RAGService
   - Affected files:
     - `server/services/ReportService.js`
     - `server/controllers/reportsController.js`
     - `server/routes/reports.js`

2. **RAGService.js**

   - Context enhancement
   - Embedding generation and storage
   - Semantic search implementation
   - Affected files:
     - `server/services/RAGService.js`
     - `server/config/openai.js` (if needed)

3. **AIFeedback.jsx**

   - Frontend RAG indicator
   - Interactive feedback UI
   - Deep-dive analysis interface
   - Affected files:
     - `client/src/components/ProgressReport/AIFeedback.jsx`
     - `client/src/components/ProgressReport/ProgressReport.jsx`
     - `client/src/services/api.js`

4. **Report.js (MongoDB Schema)**
   - TTL index implementation (optional)
   - Vector search optimization
   - Affected files:
     - `server/models/Report.js`
     - `server/config/db.js`

### Implementation Order and Dependencies

1. **Phase 1: Core RAG Implementation**

   - Update ReportService.js
   - Verify RAG functionality
   - Test data analysis accuracy

2. **Phase 2: Data Storage**

   - Implement MongoDB storage
   - Set up data retrieval
   - Optimize indexes

3. **Phase 3: Frontend Integration**

   - Add RAG indicator
   - Implement deep-dive UI
   - Test user interactions

4. **Phase 4: Performance Optimization**
   - Add caching
   - Optimize queries
   - Implement monitoring

## VII. Future Features and API Migration

### 1. Interactive User Feedback

Implementation Files:

- `client/src/components/ProgressReport/AIFeedback.jsx`: Frontend interaction
- `server/services/AIService.js`: OpenAI integration
- `server/routes/feedback.js`: API endpoints

1. **User Interface Enhancement**

```javascript
// client/src/components/ProgressReport/AIFeedback.jsx
const AIFeedbackDetail = ({ feedback }) => {
  const [userQuery, setUserQuery] = useState("");
  const [detailedResponse, setDetailedResponse] = useState(null);

  const handleQuerySubmit = async () => {
    const response = await handleUserQuery(feedback.id, userQuery);
    setDetailedResponse(response);
  };
};
```

2. **Backend Processing**

```javascript
// server/services/AIService.js
const processUserQuery = async (context) => {
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

  return await openai.generateResponse(prompt);
};
```

### 2. OpenAI Service Configuration

1. **Configuration Updates**
```javascript
// server/config/ai-service.js
const aiConfig = {
  model: "gpt-4",
  temperature: 0.7,
  max_tokens: 500,
  embedding_model: "text-embedding-3-small",
  cacheEnabled: true,
  cacheTTL: 86400 // 24 hours
};
```

2. **Service Implementation**
```javascript
// server/services/AIService.js
class AIService {
  static async generateAnalysis(prompt) {
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: "system", content: "You are a goal-oriented AI assistant." },
        { role: "user", content: prompt }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.max_tokens
    });

    return completion.choices[0].message.content;
  }

  static async generateEmbedding(text) {
    const response = await openai.embeddings.create({
      model: aiConfig.embedding_model,
      input: text,
      encoding_format: "float"
    });
    return response.data[0].embedding;
  }
}
```

### 3. Expected Improvements

1. **Response Quality**

   - More consistent output format
   - Better context understanding
   - Improved response relevance

2. **Performance Metrics**

   - Average response time: 2-3 seconds
   - Embedding generation: < 1 second
   - Context processing: < 500ms

3. **User Experience**
   - Real-time feedback interaction
   - Contextual follow-up questions
   - Seamless conversation flow

### 4. Implementation Timeline

1. **Phase 1: OpenAI Migration**

   - Replace Hugging Face implementation
   - Update configuration
   - Test new endpoints

2. **Phase 2: Interactive Features**

   - Implement user query interface
   - Add response handling
   - Test conversation flow

3. **Phase 3: Optimization**
   - Fine-tune prompts
   - Optimize response times
   - Implement caching

## VIII. Popover Focus Management Enhancement

### 1. Popover Modality Implementation

#### Current Implementation
```jsx
<Popover
  ref={ref}
  style={style}
  id={popoverId}
  open={isPopoverOpen}
  anchorEl={popoverAnchorEl}
  onClose={handlePopoverClose}
  disablePortal={false}
  disableEnforceFocus
  disableRestoreFocus
  disableScrollLock={true}
  keepMounted
  // ... other props
>
```

#### Alternative Implementation (Optional)
```jsx
<Popover
  ref={ref}
  style={style}
  id={popoverId}
  open={isPopoverOpen}
  anchorEl={popoverAnchorEl}
  onClose={handlePopoverClose}
  modality="none"
  disablePortal={false}
  disableScrollLock={true}
  keepMounted
  // ... other props
>
```

### 2. Implementation Notes

1. **Current Status**:
   - Using `disableEnforceFocus` and `disableRestoreFocus`
   - Allows interaction with other elements when Popover is open
   - May cause aria-hidden warnings

2. **Alternative Approach**:
   - Using `modality="none"`
   - Provides same functionality
   - Better accessibility support
   - Reduces warnings
   - Maintains existing close button functionality

3. **Benefits of modality="none"**:
   - Improves accessibility
   - Maintains current interaction behavior
   - Reduces console warnings
   - Better follows MUI best practices

4. **Implementation Considerations**:
   - Can be used alongside existing implementation
   - Does not require changes to close button logic
   - Maintains current drag functionality
   - Compatible with existing event handlers

## IX. Draggable Popover Implementation

### 1. Dependencies Required
```bash
npm install @dnd-kit/core
```

### 2. Component Structure
```jsx
import { DndContext, useDraggable, useSensor, PointerSensor } from '@dnd-kit/core';

// Position state management
const [position, setPosition] = useState({ x: 100, y: 100 });
const [defaultPosition] = useState({ x: 100, y: 100 });

// Draggable wrapper component
function DraggablePopover({ children, onClose }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'feedback-popover'
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    position: 'fixed',
    zIndex: 9999,
    touchAction: 'none'
  } : {
    position: 'fixed',
    zIndex: 9999,
    touchAction: 'none'
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

// Main component implementation
<DndContext
  sensors={[useSensor(PointerSensor)]}
  onDragEnd={handleDragEnd}
>
  <DraggablePopover>
    <Popover
      open={isPopoverOpen}
      anchorEl={popoverAnchorEl}
      onClose={handlePopoverClose}
      modality="none"
      disablePortal
      container={parentRef.current}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.y, left: position.x }}
      sx={{
        '& .MuiPopover-paper': {
          position: 'static',
          transform: 'none !important'
        }
      }}
    >
      {/* Existing Popover content */}
    </Popover>
  </DraggablePopover>
</DndContext>
```

### 3. Position Management
```jsx
// Handle drag end and position update
const handleDragEnd = (event) => {
  const { x, y } = position;
  const newX = x + event.delta.x;
  const newY = y + event.delta.y;
  
  // Ensure position stays within window bounds
  const maxX = window.innerWidth - 400; // 400 is approximate popover width
  const maxY = window.innerHeight - 300; // 300 is approximate popover height
  
  setPosition({
    x: Math.min(Math.max(0, newX), maxX),
    y: Math.min(Math.max(0, newY), maxY)
  });
};

// Reset position on close
const handlePopoverClose = () => {
  setPosition(defaultPosition);
  onClose?.();
};
```

### 4. Implementation Notes

1. **Position Reset**:
   - 關閉時重置到默認位置
   - 重新打開時從默認位置開始
   - 使用 defaultPosition state 保存初始位置

2. **Bounds Handling**:
   - 限制拖拽範圍在視窗內
   - 計算最大可拖拽範圍
   - 防止 Popover 被拖出視窗

3. **Style Considerations**:
   - 使用 fixed 定位確保正確的層級關係
   - 設置適當的 z-index
   - 保持原有的 Popover 樣式

4. **Accessibility**:
   - 保持 modality="none" 設置
   - 確保鍵盤操作可用
   - 維持螢幕閱讀器支持

### 5. Testing Checklist
- [ ] 拖拽功能正常工作
- [ ] 位置限制在視窗範圍內
- [ ] 關閉後重置位置
- [ ] 重新打開時位置正確
- [ ] 可訪問性保持完整
- [ ] 不影響其他功能
