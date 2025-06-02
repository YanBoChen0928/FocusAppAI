# Zustand Integration Plan

## Objective
Upgrade the Focus application from Props-based state management to using Zustand for global state management, to achieve more efficient, scalable code organization.

## Key Files
- `focus-app/client/src/store/goalStore.js` - Zustand store definition
- `focus-app/client/src/components/GoalSettingGuide/*.jsx` - Goal setting guide components
- `focus-app/client/src/components/GoalDeclaration/*.jsx` - Goal declaration components
- `focus-app/client/src/components/DailyCard/*.jsx` - Daily card components

## Implementation Plan

### Phase 1: Basic Setup and Goal Store ✓
1. Add Zustand dependency ✓
2. Create basic goalStore structure ✓
3. Implement basic functionality of goalStore ✓
   - Goal list management
   - Selected goal management
   - Goal CRUD operations
   - API integration

### Phase 2: GoalSettingGuide Component Integration ✓
1. Modify GoalSettingGuide component to use Zustand ✓
2. Modify all step components:
   - TitleStep ✓
   - MotivationStep ✓
   - ResourcesStep ✓
   - VisionStep ✓
   - RewardsStep ✓

### Phase 3: GoalDeclaration Component Integration ✓
1. Modify GoalDeclaration component to use Zustand ✓
2. Implement declaration text generation functionality ✓
3. Provide editing and updating functionality ✓

### Phase 4: Review and Optimization
1. Integrate Zustand in DailyCard
2. Optimize data flow between components
3. Remove unnecessary prop drilling
4. Add appropriate loading and error state handling

### Phase 5: Testing Plan
Here is a list of functionalities that need to be tested:

#### 5.1 Zustand Store Functionality Tests
- [ ] Fetch all goal data (`useGoalStore.getState().fetchGoals`)
- [ ] Get a single goal (`useGoalStore.getState().getGoalById`)
- [ ] Create a new goal (`useGoalStore.getState().createGoal`)
- [ ] Update existing goal (`useGoalStore.getState().updateGoal`)
- [ ] Delete goal (`useGoalStore.getState().deleteGoal`)
- [ ] Local storage persistence functionality (state remains after page refresh)
- [ ] Reset store state (`useGoalStore.getState().resetStore`)

#### 5.2 Goal Setting Guide Component Tests
- [ ] TitleStep field validation and state saving
- [ ] MotivationStep form validation and character limit
- [ ] ResourcesStep resource and step addition functionality
- [ ] VisionStep image upload and preview functionality
- [ ] RewardsStep reward setting and date selection
- [ ] Overall guide step navigation and data saving
- [ ] Form validation error handling
- [ ] Goal creation process after guide completion

#### 5.3 Goal Declaration Component Tests
- [ ] Declaration text generation based on store data
- [ ] Declaration text formatting and layout
- [ ] Edit mode toggle functionality
- [ ] Declaration update and saving
- [ ] Image display functionality

#### 5.4 API Integration Tests
- [ ] API request error handling
- [ ] Network delay handling
- [ ] Unauthorized request handling
- [ ] Server-side data validation error handling

#### 5.5 Cross-Component Integration Tests
- [ ] Create goal and display in goal list
- [ ] Select goal from list and display details
- [ ] Update goal and verify UI update
- [ ] Delete goal and verify removal from list

#### 5.6 Performance Tests
- [ ] Rendering performance with large amounts of goal data
- [ ] State update response time
- [ ] Memory usage analysis
- [ ] Repeated rendering check

## Completion Criteria
- All components use Zustand for state management, no longer relying on prop drilling
- All API calls are made through goalStore, providing a unified mechanism for data retrieval and updates
- Application state persists after refresh
- All test items pass, functionality works correctly 