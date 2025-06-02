// userStore.js
// Centralized store for user data management using Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/api';

// Create a Zustand store that persists user data
export const useUserStore = create(
  persist(
    (set, get) => ({
      // User data
      user: null,
      isLoading: false,
      error: null,
      
      // Set user data
      setUser: (userData) => {
        set({ user: userData });
        
        // Also notify via existing userEvents system for backward compatibility
        apiService.userEvents.notifyUpdate(userData);
      },
      
      // Clear user data (for logout)
      clearUser: () => {
        set({ user: null });
        
        // Also notify via existing userEvents system
        apiService.userEvents.notifyUpdate(null);
      },
      
      // Fetch user profile from API
      fetchUserProfile: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.users.getProfile();
          
          if (response.data && response.data.success) {
            set({ 
              user: response.data.data,
              isLoading: false 
            });
            return response.data.data;
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          set({ 
            error: error.message || 'Failed to fetch user data', 
            isLoading: false 
          });
          return null;
        }
      },
      
      // Update user profile
      updateUserProfile: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.users.updateProfile(userData);
          
          if (response.data && response.data.success) {
            set({ 
              user: response.data.data,
              isLoading: false 
            });
            return response.data.data;
          } else {
            throw new Error('Failed to update user data');
          }
        } catch (error) {
          console.error('Error updating user profile:', error);
          set({ 
            error: error.message || 'Failed to update user data', 
            isLoading: false 
          });
          return null;
        }
      }
    }),
    {
      name: 'user-storage', // localStorage key
      partialize: (state) => ({ user: state.user }), // Only persist user data
    }
  )
);

// Setup integration with existing userEvents system
// Subscribe to the store and update userEvents system when store changes
useUserStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      apiService.userEvents.notifyUpdate(user);
    }
  }
);

// Subscribe to userEvents system and update store when userEvents changes
const subscribeToUserEvents = () => {
  apiService.userEvents.subscribe('zustand-user-store', (userData) => {
    // Only update if the data is different to avoid loops
    const currentUser = useUserStore.getState().user;
    
    if (!currentUser || 
        !userData || 
        currentUser.username !== userData.username || 
        currentUser.email !== userData.email) {
      useUserStore.getState().setUser(userData);
    }
  });
};

// Initialize subscription
subscribeToUserEvents();

export default useUserStore; 