# AI Feedback RAG Strategy Documentation

Related Files:
- `server/services/RAGService.js`: Core RAG service implementation
- `server/services/ReportService.js`: Report generation and processing service
- `client/src/components/ProgressReport/AIFeedback.jsx`: Frontend AI feedback display component
- `server/models/Report.js`: Report data model with embedding support
- `focus-app/docs/aifeedback_rag_futureFeature.md`: Future feature planning documentation
- `focus-app/docs/AI_dataflow.md`: AI data flow documentation

## Console Logging Strategy

### RAG Process Logging
```javascript
// In ReportService.js
console.log('[RAG] Analysis type:', isDeepAnalysis ? 'Deep Analysis' : 'Basic Analysis');
console.log('[RAG] Time range:', { startDate, endDate, daysDifference });
console.log('[RAG] Model selected:', isDeepAnalysis ? 'GPT-o4-mini + RAG' : 'GPT-4o-mini');

// In RAGService.js
console.log('[RAG] Generating embedding for content length:', content.length);
console.log('[RAG] Retrieved relevant reports:', relevantReports.length);
console.log('[RAG] Historical context length:', historicalContext.length);
console.log('[RAG] Enhanced prompt length:', enhancedPrompt.length);

// Cache status
console.log('[RAG] Cache hit rate:', embeddingCache.getStats().hitRate);
console.log('[RAG] Cache keys count:', embeddingCache.getStats().keys);
```

### Performance Logging
```javascript
// Timing measurements
console.time('[RAG] Total analysis time');
console.time('[RAG] Embedding generation');
console.time('[RAG] Context retrieval');
console.time('[RAG] Prompt enhancement');

// Log completion
console.timeEnd('[RAG] Embedding generation');
console.timeEnd('[RAG] Context retrieval');
console.timeEnd('[RAG] Prompt enhancement');
console.timeEnd('[RAG] Total analysis time');
```

### Error Logging
```javascript
// Model errors and fallbacks
console.error('[RAG] GPT-o4-mini API error:', error);
console.warn('[RAG] Falling back to GPT-4o-mini due to API error');
console.log('[RAG] Model fallback successful, using GPT-4o-mini');

// Embedding errors
console.error('[RAG] Failed to generate embedding:', error);
console.warn('[RAG] Proceeding without embedding due to error');

// Context retrieval errors
console.error('[RAG] Context retrieval failed:', {
  error,
  goalId,
  reportsCount: relevantReports.length
});
console.warn('[RAG] No relevant historical context found for goal:', goalId);

// Cache errors
console.error('[RAG] Cache operation failed:', error);
console.warn('[RAG] Cache miss for embedding:', reportId);

// General process errors
console.error('[RAG] Process failed:', {
  stage: 'analysis/embedding/retrieval',
  error,
  context: {
    goalId,
    timeRange,
    modelUsed
  }
});

// Recovery and fallback logs
console.warn('[RAG] Falling back to basic analysis due to error:', error);
console.log('[RAG] Recovery successful, proceeding with basic analysis');
console.log('[RAG] Using cached embedding from previous analysis');
```

## Implementation Status and Plan

### Phase 1: Basic RAG Implementation
Planned Period: 2025/06/25-2025/07/05
- [x] RAG Basic Service Setup
  - Vector embedding generation
  - Similarity search
  - Context enhancement
- [x] Vector Storage Configuration
  - MongoDB vector index setup
  - Cache mechanism
- [x] Basic Model Selection Logic
  - GPT-4o-mini vs GPT-o4-mini selection criteria
  - Cost optimization strategy

### Phase 2: Deep Analysis Features
Planned Period: 2025/07/06-2025/07/15
- [x] Time Trigger Logic Implementation
  - 21+ days analysis trigger
  - Achievement pattern detection
- [x] Edge Case Handling
  - User-requested deep analysis (with custom focus areas)
- [x] Cache Mechanism Optimization
  - TTL strategy implementation
  - Cache update logic

### Phase 3: User Interaction Enhancement
Planned Period: 2025/07/16-2025/07/25
- [ ] User Interface Updates
  - Analysis type indicator
  - Deep analysis trigger
- [ ] Feedback Mechanism Implementation
  - User feedback collection
  - Dynamic prompt optimization
- [ ] Error Handling and Monitoring
  - Error reporting mechanism
  - Performance monitoring implementation

## Update: 2025/06/21

### Model Selection Strategy

1. **Embedding Model**:
   - Primary: text-embedding-ada-002 (1536 dimensions)
   - Cache: NodeCache with 1-hour TTL
   - Use Case: All vector embeddings for RAG

2. **Generation Models**:
   - Daily Reports: gpt-3.5-turbo
     - Fast response (1-2s)
     - Cost-effective
     - Sufficient for basic analysis
   
   - Deep Analysis: gpt-4
     - RAG-enhanced context
     - Long-term pattern analysis
     - User-initiated deep dive discussions

### Deep Analysis Criteria

1. **Time-Based Triggers**:
```javascript
const shouldUseDeepAnalysis = (startDate, endDate) => {
  const daysDifference = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );
  return daysDifference >= 21; // Activate deep analysis for 3+ weeks
};
```

2. **Edge Cases**:
```javascript
const handleEdgeCases = (startDate, endDate) => {
  // Cross-month analysis
  const isMonthlyAnalysis = startDate.getMonth() !== endDate.getMonth();
  
  // User-requested deep analysis
  const userRequestedDeepAnalysis = context.userRequestedRAG;
  
  // Milestone detection
  const hasMilestone = checkForMilestones(startDate, endDate);
  
  return isMonthlyAnalysis || userRequestedDeepAnalysis || hasMilestone;
};
```

### Implementation Strategy

1. **Cache Configuration**:
```javascript
const cacheTTL = isDeepAnalysis ? 86400 : 3600; // 24h for deep analysis, 1h for basic
```

2. **Model Selection Logic**:
```javascript
class ReportService {
  static async generateReport(goalId, startDate, endDate) {
    const isDeepAnalysis = shouldUseDeepAnalysis(startDate, endDate);
    
    if (isDeepAnalysis) {
      // Use RAG + GPT-o4-mini
      const enhancedPrompt = await RAGService.enhancePromptWithContext(
        basePrompt,
        goalId
      );
      
      return await openai.chat.completions.create({
        model: "gpt-o4-mini",
        messages: [
          { role: "system", content: "You are a goal-oriented AI assistant." },
          { role: "user", content: enhancedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
    } else {
      // Use basic GPT-4o-mini
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a goal-oriented AI assistant." },
          { role: "user", content: basePrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
    }
  }
}
```

### Benefits

1. **Cost Optimization**:
   - Selective use of expensive models
   - Reduced API calls
   - Optimized embedding generation

2. **Performance Benefits**:
   - Faster response for short-term analysis
   - Rich context for long-term trends
   - Efficient resource utilization

3. **User Experience**:
   - Clear distinction between analysis types
   - Consistent response quality
   - Appropriate depth based on timeframe

### Monitoring Metrics

1. **Usage Tracking**:
   - Deep analysis frequency
   - API cost comparison
   - Cache hit rates

2. **Performance Monitoring**:
   - Response times by analysis type
   - Embedding generation latency
   - Database query performance

### Future Considerations

1. **Manual Override**:
   - User-triggered deep analysis
   - Usage limits and quotas
   - Premium feature potential

2. **Optimization Opportunities**:
   - Dynamic TTL adjustment
   - Predictive model selection
   - Automated threshold tuning 