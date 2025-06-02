import { create } from 'zustand';

// Task-Reward Store for managing relationships between tasks and rewards
const useTaskRewardStore = create((set) => ({
  // Map of task IDs to reward IDs
  taskRewardMap: {},
  
  // Global rewards from goal declaration
  globalRewards: [],
  
  // Daily specific rewards for each day
  dailyRewards: {},
  
  // Set task-reward mapping
  setTaskRewardMap: (taskId, rewardId) => set((state) => ({
    taskRewardMap: {
      ...state.taskRewardMap,
      [taskId]: rewardId,
    },
  })),
  
  // Remove task-reward mapping
  removeTaskRewardMap: (taskId) => set((state) => {
    const newMap = { ...state.taskRewardMap };
    delete newMap[taskId];
    return { taskRewardMap: newMap };
  }),
  
  // Update global rewards
  setGlobalRewards: (rewards) => set({ globalRewards: rewards }),
  
  // Update daily rewards for a specific date
  setDailyRewards: (date, rewards) => set((state) => ({
    dailyRewards: {
      ...state.dailyRewards,
      [date]: rewards,
    },
  })),
  
  // Get rewards for a specific date - combines global rewards with date-specific ones
  getRewardsForDate: (date) => {
    const state = useTaskRewardStore.getState();
    const globalRewards = state.globalRewards || [];
    const dateRewards = state.dailyRewards[date] || [];
    return [...globalRewards, ...dateRewards];
  },
  
  // Clear all data
  clearAll: () => set({
    taskRewardMap: {},
    globalRewards: [],
    dailyRewards: {},
  }),
}));

export default useTaskRewardStore; 