# Goal Details Page Enhancement Design

## Current Structure

The current Goal Details page displays:
- A header with the goal title
- A description paragraph (showing motivation from MotivationStep)
- Progress timeline
- Daily tasks

## Planned Enhancements

### 1. Declaration Details View

**Implementation:**
- Add a document icon button to the top-right corner of the goal header
- When hovering, show tooltip with "View Declaration Details"
- Clicking opens a modal dialog with full declaration content
- Declaration text follows the template defined in AboutTheGoalSettingGuide.md
- Modal includes a close button (X) in the top-right corner

**Technical Details:**
- Use MUI Dialog component for the modal
- Retrieve declaration content from Goal.declaration.content
- Format text with appropriate spacing and typography

### 2. Vision Image and Inspirational Quote

**Implementation:**
- Display the vision image uploaded during VisionStep below the motivation text
- If no image was uploaded, display only an inspirational quote
- When image is present, display the quote below the image
- Maintain reasonable image dimensions (max height/width with proper aspect ratio)
- Add subtle visual styling to make the image stand out (light border or shadow)

**Technical Details:**
- Retrieve image URL from Goal.details.visionImage
- Use Cloudinary for image rendering with optimized delivery
- Set responsive image constraints (max-width: 100%, max-height: 300px)
- For quotes, implement either:
  - API integration with a quotes service
  - Local curated collection of goal-oriented quotes

**Inspirational Quotes Implementation Options:**
1. **External API Integration:**
   - ZenQuotes API (https://zenquotes.io/) - Free tier offers random inspirational quotes
   - Quotable API (https://github.com/lukePeavey/quotable) - Open source REST API with motivational quotes
   - They Said So Quotes API (https://theysaidso.com/api/) - Offers quote of the day

2. **Local Quote Collection:**
   - Create a JSON file with 50-100 curated motivational quotes
   - Implement a weighted random selection that favors quotes matching goal keywords
   - Categorize quotes by themes (perseverance, creativity, health, etc.)
   - Match quote selection to goal category when possible

**Sample Quote Collection Structure:**
```javascript
const quotes = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    categories: ["passion", "work", "excellence"]
  },
  {
    text: "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    author: "Winston Churchill",
    categories: ["perseverance", "courage", "resilience"]
  },
  // Additional quotes...
];
```

### 3. Enhanced Progress Timeline

**Implementation:**
- Create a GitHub-like contribution heat map
- Show daily activity frequency with color intensity
- Divide timeline into weekly segments
- Display 3 weeks per view (maximum)
- Add horizontal scrolling for viewing older weeks
- Default view shows the current week

**Technical Details:**
- Use a custom heat map component or adapt an existing library
- Color intensity based on number of records in dailyCards
- Data source: Goal.dailyCards array

### 4. Weekly DailyCards Display

**Implementation:**
- Display 7 DailyCard components in a horizontal row
- Each card represents one day of the week
- Cards start from the goal creation day
- Example: If goal created on Tuesday, cards show Tue→Mon
- Show date and weekday at the top of each card
- Cards contain:
  - Date display
  - Clickable to open detailed view

**Technical Details:**
- Auto-generate 7 initial cards upon goal creation
- Store in Goal.dailyCards array in MongoDB
- Implement card-click handler to open the daily card details view

### 5. Daily Card Detail View (New)

**Implementation:**
- Modal dialog or slide-in panel displayed when clicking a daily card
- Multiple sections for comprehensive tracking:
  1. **Header**
     - Close button (X) - Clicking it or outside the modal closes the view
     - Date display - Current card's date
     - Goal title - Retrieved from Goal.js
     - Document icon - Shows declaration details on hover/click
  
  2. **Task & Reward Section**
     - Daily task - From Goal.js dailyTask field
     - Completion status toggle
     - Daily reward - From Goal.js dailyReward field
     - Reward claim toggle (enabled only when task is completed)
  
  3. **Progress Records Section**
     - Multiple record cards
     - New record input field
     - Delete button for each record
     - Suggested format for records:
       > Spent [time] [activity] — [insight/result]
       > Example: "Spent 40 minutes organizing notes — sparked a new project idea"

  4. **Action Bar**
     - Save button - Persists changes to database

**Technical Details:**
- Use MUI Dialog or custom component
- Store in-progress edits in localStorage
- Format: `daily-card-${goalId}-${date}`
- Implement optimistic UI updates
- Use apiService.goals.addOrUpdateDailyCard for persistence

### 6. Checkpoint Progress Tracking

**Implementation:**
- Second part of Progress Timeline
- Visual indicators for checkpoint completion status
- Connect to daily tasks completion data
- Show checkmarks for completed tasks, empty for incomplete

**Technical Details:**
- Map checkpoints from Goal.checkpoints array
- Update status based on isCompleted property

### 7. AI-Generated Weekly Reports

**Implementation:**
- After 7 days of records, automatically generate an AI summary report
- Analyze completion rates, patterns, and progress
- Display below the corresponding week's cards
- Maximum 3 weeks of data per page view

**Technical Details:**
- Integrate with OpenAI API
- Analyze data from:
  - DailyCards completion records
  - Progress entries
  - Checkpoint statuses

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Goal Title                                     [Details]│
├─────────────────────────────────────────────────────────┤
│ Motivation/Description text                             │
├─────────────────────────────────────────────────────────┤
│ [Vision Image (if available)]                           │
│ "Inspirational quote related to goal achievement"       │
│  - Author Name                                          │
├─────────────────────────────────────────────────────────┤
│ Progress Timeline (Heat Map)                            │
│ [Week 1][Week 2][Week 3]                       [>>]     │
├─────────────────────────────────────────────────────────┤
│ Checkpoint Progress                                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ Mon │ │ Tue │ │ Wed │ │ Thu │ │ Fri │ │ Sat │ │ Sun │ │
│ │     │ │     │ │     │ │     │ │     │ │     │ │     │ │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
├─────────────────────────────────────────────────────────┤
│ Weekly AI Report                                        │
├─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────┘
```

## Daily Card Detail Modal Layout

```
┌───────────────────────────────────────────────────────┐
│ ✕    4/9 Wednesday                Goal Title    📄 [detail] │
├───────────────────────────────────────────────────────┤
│ Daily Task: Write notes for 30 minutes      [ ] Complete │
├───────────────────────────────────────────────────────┤
│ Daily Reward: Drink a cup of coffee         [ ] Claimed │
├───────────────────────────────────────────────────────┤
│ Today's Progress:                                     │
│ ┌─────────────────────────────────────────────────┐ 🗑 │
│ │ Spent 40 minutes organizing notes — sparked...  │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐ 🗑 │
│ │ Read 2 chapters of design book — found useful...│   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Enter new record, press Enter to submit...      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
├───────────────────────────────────────────────────────┤
│                                         [Save Changes]    │
└───────────────────────────────────────────────────────┘
```

## Recommended External Libraries

For the GitHub-like contribution visualization:
- `react-calendar-heatmap`
- `@nivo/calendar`
- `react-github-contribution-calendar`

These libraries provide customizable heat map components that can be adapted to our use case.

For inspirational quotes:
- If using a local collection approach, no library needed
- If using an API: `axios` or `fetch` for API requests
- Consider adding a caching mechanism to reduce API calls

## Design Recommendations

1. **Adaptive DailyCards Display**
   - Instead of showing a fixed 7-day pattern based on creation day, consider adapting to calendar weeks
   - This provides better consistency for users viewing multiple goals

2. **Progressive Data Loading**
   - Implement lazy loading for older DailyCards and reports
   - Improves performance for goals with extensive history

3. **Interactive Heat Map**
   - Make the heat map interactive - clicking on a specific day jumps to that day's card
   - Provides quicker navigation through historical data

4. **Offline Support**
   - Cache recent DailyCards locally to allow updates even offline
   - Sync when connection is restored

5. **Notification System**
   - Add gentle reminders based on pattern detection
   - Example: "You've completed tasks 3 days in a row! Keep going!"

6. **Progress Sharing**
   - Allow users to generate shareable progress reports
   - Option to export as image or PDF

7. **Dynamic Quote Selection**
   - Match quotes to user's current progress patterns
   - Show more encouraging quotes during periods of low activity
   - Celebrate consistency with achievement-focused quotes

## Implementation Priority

1. Declaration Details Modal
2. Vision Image and Quote Integration
3. Basic DailyCards weekly display
4. Daily Card Detail view implementation
5. Progress Timeline with heat map
6. Checkpoint tracking visualization
7. AI-generated reports

This approach allows for incremental development and testing of each feature. 