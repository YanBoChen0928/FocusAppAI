# AI Feedback and Timezone Fix Plan

## I. Issue Diagnosis

### 1. AI Feedback Issues
- Generate button unresponsive
- Incomplete data retrieval
- Inaccurate analysis content

### 2. Timezone Display Issues
- Timestamp showing "Invalid Date"
- Missing timezone information
- Inaccurate date range calculations

## II. Fix Solutions

### 1. AI Feedback Functionality Fix

#### A. Data Retrieval Layer
```javascript
// reportsController.js
const buildPrompt = (goal, startDate, endDate) => {
  // 1. Get dailyCards data
  const filteredCards = goal.dailyCards.filter(card => {
    const cardDate = new Date(card.date);
    return (!startDate || cardDate >= startDate) && 
           (!endDate || cardDate <= endDate);
  });

  // 2. Get Progress data
  const progressRecords = await Progress.find({
    goalId: goal._id,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });

  // 3. Merge data for complete report
  return generateCompletePrompt(goal, filteredCards, progressRecords);
};
```

#### B. Prompt Optimization
```javascript
const generateCompletePrompt = (goal, cards, progress) => {
  let prompt = `Analyzing goal: "${goal.title}"\n`;
  prompt += `Time range: ${formatDateRange(startDate, endDate)}\n\n`;
  
  // Add goal information
  prompt += `Goal description: ${goal.description}\n`;
  prompt += `Motivation: ${goal.motivation}\n`;
  
  // Add progress data
  if (progress.length > 0) {
    prompt += `\nProgress Statistics:\n`;
    prompt += `- Total Duration: ${calculateTotalDuration(progress)} minutes\n`;
    prompt += `- Completed Tasks: ${countCompletedTasks(progress)}\n`;
  }
  
  // Add daily records
  cards.forEach(card => {
    // Add daily completion status
  });
  
  return prompt;
};
```

### 2. Timezone Handling Fix

#### A. Date Utility Functions Standardization
```javascript
// dateUtils.js
import { formatISO, parseISO, startOfDay, endOfDay } from 'date-fns';

// 1. ISO format conversion
export const toISOWithTimezone = (date) => {
  if (!date) return null;
  return formatISO(new Date(date));
};

// 2. Local time parsing
export const parseToLocalDate = (isoString) => {
  if (!isoString) return null;
  try {
    return parseISO(isoString);
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
};

// 3. Date range handling
export const getDateRange = (days) => {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(new Date(), days - 1));
  return { start, end };
};
```

#### B. Component Implementation
```javascript
// AIFeedback.jsx
const AIFeedback = ({ goalId }) => {
  // 1. State management
  const [timeRange, setTimeRange] = useState('last7days');
  const { start, end } = getDateRange(7);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  // 2. Timestamp display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = parseToLocalDate(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  // 3. Data retrieval
  const generateFeedback = async () => {
    try {
      const response = await apiService.reports.generate(
        goalId,
        toISOWithTimezone(startDate),
        toISOWithTimezone(endDate)
      );
      // Handle response...
    } catch (error) {
      // Error handling...
    }
  };
};
```

## III. Implementation Steps

1. **Infrastructure Update**
   - Update date-fns dependency
   - Ensure all timezone-related utility functions are available

2. **Backend Modifications**
   - Update date handling in `reportsController.js`
   - Optimize data retrieval logic
   - Improve prompt generation

3. **Frontend Modifications**
   - Implement new date utility functions
   - Update AIFeedback component
   - Fix timestamp display

4. **Testing Plan**
   - Test timezone handling across different zones
   - Verify AI feedback accuracy
   - Check timestamp display

## IV. Verification Checklist

- [ ] AI feedback button responds normally
- [ ] Generated analysis report contains complete progress data
- [ ] Timestamps display correctly (with timezone info)
- [ ] Date range selection works properly
- [ ] Tests pass across different timezones
- [ ] Error handling mechanism is robust

## V. Important Notes

1. All date handling must follow README timezone standards
2. Ensure backward compatibility
3. Add appropriate logging
4. Maintain user-friendly error messages 