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
  } : undefined;

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
      {/* Existing Dialog */}
      
      {/* Wrap Popover with DraggablePopover */}
      <DraggablePopover>
        <Popover
          // Existing Popover configuration
          {...existingProps}
        >
          {/* Existing Popover content */}
        </Popover>
      </DraggablePopover>
      
      {/* Existing AI Feedback Sections */}
    </DndContext>
  );
}
```

### Testing Focus
- Verify smooth drag functionality
- Ensure responsive layout remains intact
- Check that all existing features work correctly
- Verify performance and animation smoothness

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