# Archive Feature Implementation Plan

## Overview
Add an archive folder/section to the Sidebar to store archived goals. When a goal is marked as "archived", it will be moved to this section and its date will be frozen at the completion date.

## Key Implementation Details

### 1. Sidebar Updates
- Add a collapsible "Archived Goals" section to the Sidebar
- Implement a toggle button to show/hide archived goals
- Create visual distinction between active and archived goals

### 2. Data Handling Changes
- Modify the goals filtering logic to properly separate active and archived goals
- Ensure archived goals preserve their completion date without future modifications
- Update the UI to show the completion date rather than allowing date changes

### 3. State Management
- Add state variables to track whether the archive section is expanded/collapsed
- Modify the goal filtering logic to account for archived goals visibility
- Ensure proper handling of archived goals when selected

### 4. UI/UX Considerations
- Add a visual indicator (folder icon) for the archive section
- Include a counter showing the number of archived goals
- Apply subtle styling to differentiate archived goals
- Disable date modification controls for archived goals
- Show a timestamp indicating when the goal was archived

### 5. API Integration
- Ensure proper API calls when archiving/unarchiving goals
- Confirm that archived goals are saved with their completion status
- Maintain data integrity during state transitions

## Implementation Approach
1. First add the archive section UI elements to the Sidebar
2. Implement the state management for toggling archive visibility
3. Modify the filtering logic to handle both sections
4. Update the GoalCard component to prevent date changes for archived items
5. Add visual distinctions and proper date display for archived items
6. Test and verify the functionality

## Code Changes Required

### Sidebar.jsx
- Add new state variable: `const [showArchived, setShowArchived] = useState(false);`
- Create a separate section for archived goals with a toggle button
- Update the filtering logic to handle both active and archived goals
- Add a visual folder icon for the archive section

### GoalCard.jsx
- Modify the component to disable date picker when goal is archived
- Update the date display to show "Completed on: [date]" for archived goals
- Add visual styling to clearly indicate archived status

## Benefits
This implementation will allow proper organization of completed goals while maintaining the current UI structure and user experience. Users will be able to:
1. Keep track of their completed goals in an organized manner
2. See when goals were completed
3. Reference past achievements without cluttering the active goals list 