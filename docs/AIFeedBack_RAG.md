# AI Feedback RAG Strategy Documentation

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
      // Use RAG + GPT-4
      const enhancedPrompt = await RAGService.enhancePromptWithContext(
        basePrompt,
        goalId
      );
      
      return await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a goal-oriented AI assistant." },
          { role: "user", content: enhancedPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
    } else {
      // Use basic GPT-3.5
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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