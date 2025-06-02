import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * MainTask Store - Global state management for main tasks
 * Ensures that when GoalDeclaration is updated, the main task state is synchronized to other components
 */
const useMainTaskStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Store main tasks for each goal
        mainTasks: {}, // goalId -> mainTask
        
        // Add or update main task
        setMainTask: (goalId, taskText) => {
          if (!goalId) return;
          
          console.log('Setting main task in MainTaskStore:', { goalId, taskText });
          set((state) => ({
            mainTasks: {
              ...state.mainTasks,
              [goalId]: taskText
            }
          }));
        },
        
        // Get main task for a goal
        getMainTask: (goalId) => {
          if (!goalId) return null;
          const state = get();
          return state.mainTasks[goalId] || null;
        },
        
        // Remove main task for a goal
        removeMainTask: (goalId) => {
          if (!goalId) return;
          
          set((state) => {
            const updatedTasks = { ...state.mainTasks };
            delete updatedTasks[goalId];
            return { mainTasks: updatedTasks };
          });
        },
        
        // Clear all main tasks
        clearAllMainTasks: () => set({ mainTasks: {} })
      }),
      {
        name: 'main-task-storage',
      }
    )
  )
);

export default useMainTaskStore; 