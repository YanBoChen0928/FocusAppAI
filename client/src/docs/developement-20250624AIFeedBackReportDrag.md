# AIFeedback Draggable Feature Implementation Plan

## Related Files
- /src/components/ProgressReport/AIFeedback.jsx (main implementation)
- /src/components/ProgressReport/ProgressReport.module.css (existing styles)

## Implementation Overview
Implement simple drag and drop functionality for the AIFeedback Popover using @dnd-kit/core.

## Phase 1: Basic Draggable Functionality

### Goals
1. Add basic drag functionality to Popover
2. Maintain existing responsive design
3. Keep all current functionality intact
4. Ensure proper z-index and positioning

### Implementation Steps
1. Install Required Package
```bash
npm install @dnd-kit/core
```

2. Import DnD Kit Components
```jsx
import {
  DndContext,
  useDraggable
} from '@dnd-kit/core';
```

3. Implement Draggable Wrapper Component
```jsx
function DraggablePopover({ children }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'feedback-popover',
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    position: 'fixed',
    zIndex: 9999,
    touchAction: 'none',
    width: 'auto',
    height: 'auto',
    top: 0,
    left: 0
  } : {
    position: 'fixed',
    zIndex: 9999,
    touchAction: 'none',
    width: 'auto',
    height: 'auto',
    top: '30vh',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
```

4. Modify AIFeedback Component Structure
```jsx
export default function AIFeedback({ goalId }) {
  return (
    <DndContext>
      {/* Wrap Popover with DraggablePopover */}
      <DraggablePopover>
        <Popover
          // Existing Popover configuration
          sx={{
            '& .MuiPopover-paper': {
              position: 'static',
              transform: 'none !important'
            }
          }}
          PaperProps={{
            sx: {
              position: 'static'
            }
          }}
        >
          {/* Existing Popover content */}
        </Popover>
      </DraggablePopover>
    </DndContext>
  );
}
```

### Key Implementation Details
1. Fixed Positioning:
   - Use `position: fixed` to ensure Popover stays above all content
   - High `z-index: 9999` to maintain top layer position
   - Initial centered position with `top: 30vh` and `left: 50%`

2. Transform Handling:
   - Use `transform: none !important` on Popover paper to prevent MUI's transform
   - Apply drag transform through DraggablePopover wrapper
   - Maintain smooth transition during drag

3. Event Handling:
   - Prevent event propagation to underlying elements
   - Maintain existing click and interaction handlers
   - Keep backdrop pointer events disabled

### Testing Focus
- Verify smooth drag functionality
- Ensure Popover stays visible during drag
- Check z-index handling with other elements
- Verify responsive layout remains intact
- Test all existing features still work
- Check performance and animation smoothness

## Important Notes
1. Keep existing responsive design
2. Maintain current Popover styling
3. Ensure drag functionality doesn't interfere with other interactions
4. Keep code simple and focused on basic drag functionality

## Time Estimation
- Implementation and testing: 2-3 hours

## Future Considerations (if needed)
1. Add bounds to restrict dragging area
2. Add position persistence
3. Add reset position functionality 