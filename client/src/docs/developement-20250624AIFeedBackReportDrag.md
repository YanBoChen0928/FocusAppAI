# AIFeedback Draggable Feature Implementation Plan

## Related Files
- /src/components/ProgressReport/AIFeedback.jsx (main implementation)
- /src/store/positionStore.js (to be created)
- /src/components/ProgressReport/ProgressReport.module.css (existing styles)

## Implementation Overview
The AIFeedback component draggable functionality will be implemented in two phases while maintaining the existing responsive design.

## Phase 1: Basic Draggable Functionality

### Goals
1. Add basic drag functionality
2. Set default position
3. Ensure existing features remain functional

### Implementation Steps
1. Import MUI Draggable Component
```jsx
// Import Draggable component from MUI
import Draggable from '@mui/material/Draggable';
```

2. Modify AIFeedback.jsx Component Structure
```jsx
// Wrap Popover with Draggable component
<Draggable
  handle=".drag-handle"  // Enable drag only on handle area
  bounds="parent"        // Restrict movement within parent
  defaultPosition={{ x: 0, y: 0 }}
>
  <Popover
    // Existing Popover configuration remains unchanged
    {...existingProps}
  >
    {/* Add drag handle to the top section */}
    <div className="drag-handle">
      {/* Existing header content */}
    </div>
    {/* Existing Popover content */}
  </Popover>
</Draggable>
```

3. Add Required Styles
```css
/* Add drag handle styles while preserving existing styles */
.drag-handle {
  cursor: move;
  user-select: none;
  /* Preserve existing styles */
}
```

4. Maintain Existing Responsive Design
```css
/* Maintain existing responsive design */
[theme.breakpoints.down('sm')]: {
  width: '90vw',
},
[theme.breakpoints.up('md')]: {
  width: '380px',
},
[theme.breakpoints.up('lg')]: {
  width: '60vw',
},
```

### Testing Focus
- Verify draggable functionality works correctly
- Ensure responsive layout remains intact
- Verify existing click-through functionality
- Check animation effects remain smooth

## Phase 2: Feature Enhancement and Persistence

### Goals
1. Add position persistence
2. Implement position reset functionality
3. Optimize drag experience

### Implementation Steps
1. Create Position Store
```javascript
// stores/positionStore.js - Position state management
import create from 'zustand';

const usePositionStore = create((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (pos) => set({ position: pos }),
  resetPosition: () => set({ position: { x: 0, y: 0 } }),
}));

export default usePositionStore;
```

2. Integrate Store
```jsx
// Import and use position store in AIFeedback component
const position = usePositionStore((state) => state.position);
const setPosition = usePositionStore((state) => state.setPosition);

// Integrate with Draggable component
<Draggable
  position={position}
  onDrag={(e, data) => setPosition({ x: data.x, y: data.y })}
>
  {/* Existing component structure */}
</Draggable>
```

3. Add Reset Functionality
```jsx
// Add reset position functionality
const resetPosition = usePositionStore((state) => state.resetPosition);

// Add reset button to the component
<IconButton 
  onClick={resetPosition}
  title="Reset Position"
>
  <RestoreIcon />
</IconButton>
```

### Testing Focus
- Verify position persistence works correctly
- Test reset functionality behavior
- Ensure smooth drag experience
- Test edge cases and boundaries

## Important Notes
1. Maintain existing responsive design functionality
2. Ensure drag feature doesn't interfere with existing interactions
3. Handle edge cases and limitations properly
4. Maintain performance optimization

## Time Estimation
- Phase 1: 1-2 days
- Phase 2: 1-2 days

## Future Optimization (if needed)
1. Add drag animation effects
2. Optimize drag handle visual design
3. Add additional customization options 