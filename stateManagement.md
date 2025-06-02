# Focus App State Management

## Overview 概述

Focus App uses Zustand for global state management. Zustand is a small, fast, and scalable state management solution that uses a simplified flux-like architecture. It is selected for its minimal boilerplate, high performance, and ease of integration with React hooks.

Focus应用使用Zustand进行全局状态管理。Zustand是一个小型、快速且可扩展的状态管理解决方案，采用简化的类Flux架构。选择它是因为其最小化的样板代码、高性能以及与React钩子的轻松集成。

## State Management Tools 状态管理工具

- **Primary State Management**: Zustand
- **Middleware**: 
  - `persist` (for local storage persistence)
  - `devtools` (for Redux DevTools integration)
- **Local Component State**: React's useState/useEffect hooks

**主要状态管理**: Zustand  
**中间件**:
  - `persist` (用于本地存储持久化)
  - `devtools` (用于Redux DevTools集成)  
**组件本地状态**: React的useState/useEffect钩子

## Store Structure 存储结构

The application state is divided into specialized stores for different domains:

应用状态分为针对不同领域的专门存储：

### 1. User Store (userStore.js)

Manages user authentication and profile data.

管理用户认证和个人资料数据。

```javascript
{
  user: Object | null,  // Current user object or null if not authenticated
  isLoading: Boolean,   // Loading state for API calls
  error: String | null, // Error message if any
  // Actions
  setUser,              // Set user data
  clearUser,            // Clear user data (logout)
  fetchUserProfile,     // Fetch user profile from API
  updateUserProfile     // Update user profile
}
```

### 2. Report Store (reportStore.js)

Manages AI-generated reports for goals.

管理目标的AI生成报告。

```javascript
{
  reports: {
    [goalId]: {         // Reports indexed by goal ID
      content: String,  // Report content
      generatedAt: Date,// Generation timestamp
      dateRange: {      // Report date range
        startDate: Date,
        endDate: Date
      }
    }
  },
  // Actions
  setReport,            // Set a report for a specific goal
  getReport,            // Get a report for a specific goal
  clearReports          // Clear all reports
}
```

### 3. Main Task Store (mainTaskStore.js)

Manages the main tasks for goals across components.

管理跨组件的目标主要任务。

```javascript
{
  mainTasks: {
    [goalId]: String    // Main task text indexed by goal ID
  },
  // Actions
  setMainTask,          // Set main task for a goal
  getMainTask,          // Get main task for a goal
  removeMainTask,       // Remove main task for a goal
  clearAllMainTasks     // Clear all main tasks
}
```

### 4. Task-Reward Store (taskRewardStore.js)

Manages relationships between tasks and rewards.

管理任务和奖励之间的关系。

```javascript
{
  taskRewardMap: {
    [taskId]: rewardId  // Maps task IDs to reward IDs
  },
  globalRewards: Array, // Global rewards from goal declaration
  dailyRewards: {
    [date]: Array       // Date-specific rewards
  },
  // Actions
  setTaskRewardMap,     // Set task-reward mapping
  removeTaskRewardMap,  // Remove task-reward mapping
  setGlobalRewards,     // Update global rewards
  setDailyRewards,      // Update daily rewards for a date
  getRewardsForDate,    // Get rewards for a specific date
  clearAll              // Clear all data
}
```

## State Lifecycle 状态生命周期

1. **Initialization**: Stores are created and initialized when the application starts. For persisted stores, data is loaded from localStorage.

   **初始化**：应用启动时创建并初始化存储。对于持久化的存储，数据从localStorage加载。

2. **Component Consumption**: Components access store data using the `useStore` hook pattern.

   **组件消费**：组件使用`useStore`钩子模式访问存储数据。

3. **State Updates**: Components call store actions to update state, which triggers re-renders of all components consuming that slice of state.

   **状态更新**：组件调用存储动作更新状态，触发所有消费该状态切片的组件重新渲染。

4. **Persistence**: Selected stores persist their state to localStorage using the Zustand persist middleware.

   **持久化**：选定的存储使用Zustand persist中间件将其状态持久化到localStorage。

5. **Cleanup**: Some stores implement clear actions that are called during logout to reset state.

   **清理**：一些存储实现了在登出过程中调用的清除动作以重置状态。

## State Propagation 状态传播

### Within Components 组件内部

- Components access state directly via hooks: `const { user } = useUserStore()`
- Components update state by calling store actions: `useUserStore.getState().setUser(data)`

### Across Components 跨组件

- State changes automatically propagate to all components consuming the store
- For optimized rendering, components can subscribe to specific parts of the state:
  ```javascript
  const username = useUserStore(state => state.user?.username)
  ```

## Integration with Backend API 与后端API集成

- Store actions encapsulate API calls, handling loading states and errors
- Asynchronous actions use async/await pattern with try/catch for error handling
- API responses update store state, which automatically propagates to components

## Optimizations 优化措施

1. **Selective Re-rendering**: Components subscribe only to the state they need
2. **Memoization**: Complex derived state is memoized to prevent unnecessary recalculations
3. **Batched Updates**: Related state changes are batched where possible
4. **Lazy Initialization**: Some state is initialized only when needed

## Best Practices 最佳实践

1. Keep store actions inside the store definition for encapsulation
2. Use selectors to access specific parts of state for performance
3. Minimize cross-store dependencies
4. Use the persist middleware only for essential data
5. Clear sensitive data on logout

## Debugging 调试

1. Redux DevTools Integration: Use the Redux DevTools browser extension to inspect state changes
2. Console Logging: Critical state transitions are logged to the console
3. Error Handling: API errors are captured in the store state

## Migration from Context API 从Context API迁移

The application has partially migrated from React Context API to Zustand for better performance and simpler API.
Some legacy context providers remain and integrate with Zustand stores for backward compatibility.

应用程序已部分从React Context API迁移到Zustand，以获得更好的性能和更简单的API。
一些遗留的上下文提供者仍然存在，并与Zustand存储集成以实现向后兼容。
