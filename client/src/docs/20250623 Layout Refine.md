# Layout Refinement Plan - Single Scrollbar Implementation

Related Files:
- `focus-app/client/src/styles/Home.css`: Main layout styles
- `focus-app/client/src/styles/GlobalStyles.css`: Global styles
- `focus-app/client/src/App.css`: App-level styles
- `focus-app/client/src/components/ProgressReport/ProgressReport.module.css`: Progress report styles
- `focus-app/client/src/components/Sidebar/Sidebar.jsx`: Sidebar component
- `focus-app/client/src/components/GoalDetails/DailyCardRecord.jsx`: Daily card record component
- `focus-app/client/src/components/GoalDetails/WeeklyDailyCards.module.css`: Weekly cards styles
- `focus-app/client/src/components/GoalDetails/DailyCard.module.css`: Daily card styles
- `focus-app/client/src/components/GoalDetails/GoalDetails.module.css`: Goal details styles
- `focus-app/client/src/components/Sidebar/GoalCard.module.css`: Goal card styles

## Overview
This document outlines the plan to refine the layout structure to implement a single scrollbar design. The goal is to remove individual scrollbars from each container and maintain only one main scrollbar on the right side of the viewport.

## Current Issues
1. Multiple scrollbars appear in different containers:
   - Sidebar container
   - Goal details container
   - Progress report container
2. Each container has its own `overflow-y: auto` property
3. Fixed heights on containers causing unnecessary scrollbars
4. Inconsistent overflow handling across responsive breakpoints

## Implementation Plan

### Phase 1: Base Container Structure
1. Modify `Home.css`:
```css
/* Main container with single scrollbar */
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  overflow-y: auto; /* Main scrollbar */
  overflow-x: hidden;
}

/* Content container without scroll */
.main-content {
  display: flex;
  width: 100%;
  height: fit-content;
  overflow: visible;
}

/* Remove scrollbars from main sections */
.main-content > :nth-child(1), /* Sidebar */
.main-content > :nth-child(2), /* GoalDetails */
.main-content > :nth-child(3) { /* ProgressReport */
  overflow-y: visible !important;
  height: fit-content !important;
  min-height: unset;
}
```

### Phase 2: Global Styles and MUI Components
1. Update `GlobalStyles.css`:
```css
/* Global component styles */
.sidebar,
.goal-details,
.progress-report {
  overflow-y: visible !important;
  height: fit-content !important;
  min-height: unset !important;
}
```

2. Override MUI Components:
```css
/* MUI component overrides */
.MuiBox-root.css-1vri4ks,
.goal-details.MuiBox-root.css-14nuhdb,
._reportContainer_1uapj_2.MuiBox-root.css-1297fjn {
  overflow-y: visible !important;
  height: fit-content !important;
  min-height: unset !important;
}
```

### Phase 3: Responsive Design Review
Files to check for overflow settings:
1. `ProgressReport.module.css`:
   - Remove `overflow-y: auto` from `.reportContainer`
   - Keep text overflow settings

2. `Sidebar.jsx`:
   - Remove `overflowY: "auto"` from Box component
   - Maintain content visibility

3. `DailyCardRecord.jsx`:
   - Review Paper component overflow settings
   - Adjust max-height if needed

4. Component-specific styles:
   - Review all media queries
   - Remove unnecessary overflow settings
   - Keep text ellipsis and horizontal overflow controls

## Implementation Steps
1. Execute Phase 1:
   - Update base container structure
   - Test basic scrolling behavior

2. Execute Phase 2:
   - Apply global style updates
   - Override MUI component styles
   - Test component rendering

3. Execute Phase 3:
   - Review all responsive breakpoints
   - Remove unnecessary overflow settings
   - Test across all screen sizes
   - Verify content behavior

## Notes
- Use `!important` to ensure style overrides
- Keep `box-sizing: border-box` for consistent layout
- Maintain padding and margins for proper spacing
- Preserve text overflow handling (ellipsis, etc.)
- Test with various content lengths
- Ensure accessibility is maintained
- Document any special cases or exceptions 