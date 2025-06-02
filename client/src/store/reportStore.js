// reportStore.js
// Store for managing AI analysis reports across goal switching

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Using persist middleware to keep reports data between page refreshes
export const useReportStore = create(
  persist(
    (set, get) => ({
      // Store structure: { goalId1: { content, generatedAt, dateRange }, goalId2: {...}, ... }
      reports: {},
      
      // Set a report for a specific goal
      setReport: (goalId, reportData) => 
        set((state) => ({
          reports: {
            ...state.reports,
            [goalId]: {
              ...reportData,
              generatedAt: new Date().toISOString(),
              dateRange: {
                startDate: reportData.startDate || new Date().toISOString(),
                endDate: reportData.endDate || new Date().toISOString()
              }
            }
          }
        })),
      
      // Get a report for a specific goal
      getReport: (goalId) => get().reports[goalId] || null,
      
      // Clear all reports (useful for logout or reset)
      clearReports: () => set({ reports: {} })
    }),
    {
      name: 'ai-reports-storage', // localStorage key
      // Only persist the reports object
      partialize: (state) => ({ reports: state.reports })
    }
  )
); 