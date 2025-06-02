import { create } from 'zustand';

const useRewardsStore = create((set, get) => ({
  // Store for reward data
  dailyRewards: {},
  // Store for reward data from declaration
  declarationRewards: {},
  
  // Set a reward for a goal
  setGoalReward: (goalId, reward) => {
    if (!goalId) return;
    
    console.log('Setting reward in Zustand store:', { goalId, reward });
    set((state) => ({
      dailyRewards: {
        ...state.dailyRewards,
        [goalId]: reward
      }
    }));
  },
  
  // Set a reward from declaration for a goal
  setDeclarationReward: (goalId, reward) => {
    if (!goalId) return;
    
    console.log('Setting declaration reward in Zustand store:', { goalId, reward });
    set((state) => ({
      declarationRewards: {
        ...state.declarationRewards,
        [goalId]: reward
      },
      // Also update dailyRewards to ensure immediate updates
      dailyRewards: {
        ...state.dailyRewards,
        [goalId]: reward
      }
    }));
  },
  
  // Get reward for a goal - prioritize declaration reward
  getGoalReward: (goalId) => {
    if (!goalId) return null;
    const state = get();
    // First check declaration reward, then fallback to daily reward
    return state.declarationRewards[goalId] || state.dailyRewards[goalId] || null;
  },
  
  // Clear all rewards
  clearRewards: () => set({ dailyRewards: {}, declarationRewards: {} })
}));

export default useRewardsStore; 