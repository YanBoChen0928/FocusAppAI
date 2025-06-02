import axios from "axios";

// set backend API URL - use environment variable for production
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || "https://focusfinalproject-main-backend.onrender.com";
const DEVELOPMENT_API_URL = "http://localhost:5050";

// choose API URL based on environment - optimize environment detection logic
const isProduction =
  import.meta.env.PROD === true || import.meta.env.MODE === "production";
const API_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

// 尝试探测本地API端口是否可用
const checkLocalApiPort = async (basePort = 5050, maxAttempts = 3) => {
  if (isProduction) return API_URL; // 生产环境不需要探测

  for (let i = 0; i < maxAttempts; i++) {
    const portToCheck = basePort + i;
    const url = `http://localhost:${portToCheck}/api/health`;
    
    try {
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        console.log(`找到可用的API端口: ${portToCheck}`);
        return `http://localhost:${portToCheck}`;
      }
    } catch (error) {
      console.log(`端口 ${portToCheck} 无法连接:`, error.message);
    }
  }
  
  console.log(`无法找到可用的API端口，使用默认地址: ${API_URL}`);
  return API_URL;
};

// 立即开始探测端口 (异步)
let detectedApiUrl = API_URL;
checkLocalApiPort().then(url => {
  detectedApiUrl = url;
  console.log("API URL已更新为:", detectedApiUrl);
});

// output configuration information, help diagnose connection issues
console.log("=== API configuration information ===");
console.log("Running mode:", import.meta.env.MODE);
console.log("Is production environment:", import.meta.env.PROD);
console.log("Environment variable VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("Environment detection result:", isProduction ? "Production environment" : "Development environment");
console.log("Initial API URL:", API_URL);
console.log("====================");

// create axios instance with dynamic baseURL
const api = axios.create({
  withCredentials: true, // allow cross-domain requests to carry cookies
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// 请求拦截器，动态设置baseURL
api.interceptors.request.use(
  async (config) => {
    // 确保使用最新检测到的API URL
    config.baseURL = detectedApiUrl;
    
    // record the complete request URL, helpful for debugging
    console.log(`Sending request to: ${config.baseURL}${config.url}`);

    // no longer use X-User-Id header, rely on JWT cookie for authentication
    // JWT cookie will be automatically attached to requests because withCredentials: true is set

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // handle network errors
    if (error.code === "ERR_NETWORK") {
      console.error("Network connection error:", {
        message: error.message,
        url: error.config
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown",
        baseURL: detectedApiUrl,
        headers: error.config ? error.config.headers : "Unknown",
      });

      // if the request is for profile, provide more specific error information
      if (
        error.config &&
        error.config.url &&
        error.config.url.includes("/api/users/profile")
      ) {
        console.error("Failed to get user data - unable to connect to API server. Possible reasons:");
        console.error("1. Backend service is not running");
        console.error("2. Incorrect API_URL configuration:", detectedApiUrl);
        console.error("3. Cross-domain request issue");
        console.error("4. Cookie not set correctly");

        // check authentication status
        const userId = localStorage.getItem("userId");
        const token = document.cookie.includes("token=");
        console.error("Authentication status check:", {
          hasUserId: !!userId,
          hasCookie: token,
        });
      }
    }
    // handle authorization errors
    else if (error.response && error.response.status === 401) {
      console.log("Unauthorized, checking user type for redirect");
      
      // Check if this is a temporary user
      const tempId = localStorage.getItem("tempId");
      
      // Clear userId if exists (it's unauthorized anyway)
      localStorage.removeItem("userId");
      
      // Redirect based on user type
      if (tempId) {
        console.log("Unauthorized tempId user, redirecting to guest login");
        window.location.href = "/guest-login";
      } else {
        console.log("Unauthorized registered user, redirecting to login");
        window.location.href = "/login";
      }
    }
    // handle other errors
    else {
      console.error("API error:", {
        message: error.message,
        url: error.config
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown",
        status: error.response ? error.response.status : "No response",
        data: error.response ? error.response.data : "No data",
      });
    }

    return Promise.reject(error);
  }
);

// health check method - confirm API connection
const checkApiHealth = async () => {
  try {
    console.log("Executing API health check...");
    const response = await api.get("/api/health");
    console.log("API connection is healthy:", response.data);
    return true;
  } catch (error) {
    console.error("API connection error:", error.message);
    console.log("Attempted API URL:", detectedApiUrl);
    return false;
  }
};

// Add event system for user data updates
// This allows components to subscribe to user profile changes
const userEvents = {
  // Event listeners for user profile updates
  listeners: {},
  
  // Current user data cache
  currentUser: null,
  
  // Register a listener for user profile updates
  subscribe: (id, callback) => {
    userEvents.listeners[id] = callback;
    
    // Return unsubscribe function
    return () => {
      delete userEvents.listeners[id];
    };
  },
  
  // Call when user profile is updated
  notifyUpdate: (userData) => {
    // Update cache
    userEvents.currentUser = userData;
    
    // Store in localStorage for simple access by other components
    if (userData && userData.username) {
      localStorage.setItem('username', userData.username);
    }
    
    // Notify all listeners
    Object.values(userEvents.listeners).forEach(callback => {
      try {
        callback(userData);
      } catch (error) {
        console.error("Error in user update listener:", error);
      }
    });
    
    // Also dispatch DOM event for components that use direct DOM event listeners
    const event = new CustomEvent('userProfileUpdated', { detail: userData });
    window.dispatchEvent(event);
    
    console.log("Notified all components about user profile update");
  },
  
  // Get current user data
  getCurrentUser: () => userEvents.currentUser
};

// encapsulate API methods
const apiService = {
  // userEvents system for sharing user data
  userEvents,

  // diagnostic method
  getDiagnostics: () => {
    return {
      apiUrl: detectedApiUrl,
      mode: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://focusappdeploy-frontend.onrender.com",
        "https://focusfinalproject-frontend-original.onrender.com",
        "https://focusfinalproject-main-frontend.onrender.com",
      ],
    };
  },

  // health check
  healthCheck: checkApiHealth,

  // authentication related
  auth: {
    register: (userData) => {
      console.log(`register: sending registration request, data:`, {
        ...userData,
        password: userData.password ? '******' : undefined
      });
      return api.post("/api/auth/register", userData)
        .then(response => {
          console.log(`register: registration successful, response:`, response.data);
          return response;
        })
        .catch(error => {
          console.error(`register: registration failed, error:`, error.response ? error.response.data : error.message);
          throw error;
        });
    },
    login: (credentials) => api.post("/api/auth/login", credentials),
    logout: () => api.post("/api/auth/logout"),
    getCurrentUser: (userId) => api.get(`/api/auth/me/${userId}`),
    createTempUser: (data = {}) => api.post("/api/temp-users", data),
  },

  // user related
  users: {
    getProfile: () => {
      console.log("Calling getProfile method, API_URL:", detectedApiUrl);
      return api.get("/api/users/profile")
        .then(response => {
          // Cache user data and notify all components
          if (response.data && response.data.success && response.data.data) {
            userEvents.notifyUpdate(response.data.data);
          }
          return response;
        });
    },
    updateProfile: (data) => {
      return api.put("/api/users/profile", data)
        .then(response => {
          // Update cached user data and notify all components
          if (response.data && response.data.success && response.data.data) {
            userEvents.notifyUpdate(response.data.data);
          }
          return response;
        });
    },
    changePassword: (data) => api.put("/api/users/password", data),
    deleteAccount: () => api.delete("/api/users/account"),
  },

  // temporary user related
  tempUsers: {
    delete: (tempId) => api.delete(`/api/temp-users/${tempId}`),
  },

  // goal related
  goals: {
    getAll: () => api.get("/api/goals"),
    getById: (id) => api.get(`/api/goals/detail/${id}`),
    getUserGoals: (userId) => {
      console.log(`API call getUserGoals, user ID: ${userId}`, { isTemporary: userId && userId.toString().startsWith('temp_') });
      return api.get(`/api/goals/${userId}`)
        .catch(error => {
          console.error(`getUserGoals error, user ID: ${userId}`, error);
          throw error;
        });
    },
    create: (goalData) => {
      // Validate targetDate before submitting
      if (goalData.targetDate) {
        console.log("create: targetDate validation:", {
          value: goalData.targetDate,
          type: typeof goalData.targetDate,
          isDateObject: goalData.targetDate instanceof Date,
          isoString: goalData.targetDate instanceof Date ? goalData.targetDate.toISOString() : goalData.targetDate
        });
      }
      
      return api.post("/api/goals", goalData);
    },
    update: (id, goalData) => {
      // Validate targetDate before submitting
      if (goalData.targetDate) {
        console.log("update: targetDate validation:", {
          value: goalData.targetDate,
          type: typeof goalData.targetDate,
          isDateObject: goalData.targetDate instanceof Date,
          isoString: goalData.targetDate instanceof Date ? goalData.targetDate.toISOString() : goalData.targetDate
        });
      }
      
      return api.put(`/api/goals/${id}`, goalData)
        .then(response => {
          console.log(`update: goal updated successfully, ID: ${id}`, response.data);
          return response;
        })
        .catch(error => {
          console.error(`update: goal update failed, ID: ${id}`, error);
          console.error(`update: error details:`, {
            message: error.message,
            status: error.response?.status,
            response: error.response?.data
          });
          throw error;
        });
    },
    delete: (id) => api.delete(`/api/goals/${id}`),
    updateStatus: (id, status) =>
      api.put(`/api/goals/${id}/status`, { status }),
    addCheckpoint: (id, checkpoint) =>
      api.post(`/api/goals/${id}/checkpoints`, checkpoint),
    addOrUpdateDailyCard: (id, cardData) =>
      api.post(`/api/goals/${id}/daily-card`, cardData)
        .then(response => {
          console.log('addOrUpdateDailyCard: daily card saved successfully, goalId:', id, 'response:', response.data);
          return response;
        })
        .catch(error => {
          console.error('addOrUpdateDailyCard: daily card save failed, goalId:', id, 'error:', error.message);
          console.error('addOrUpdateDailyCard: error details:', {
            goalId: id,
            error: error.message,
            status: error.response?.status,
            response: error.response?.data
          });
          throw error;
        }),
    search: (query, dateRange) => {
      const params = {};
      if (query) params.query = query;
      if (dateRange && dateRange.startDate) params.createdStartDate = dateRange.startDate;
      if (dateRange && dateRange.endDate) params.createdEndDate = dateRange.endDate;
      
      // Add searchType parameter to explicitly request OR logic
      params.searchType = 'or';
      
      const queryString = new URLSearchParams(params).toString();
      console.log(`Executing search with query: ${queryString}`);
      console.log(`Full URL: ${detectedApiUrl}/api/goals/search?${queryString}`);
      
      return api.get(`/api/goals/search?${queryString}`)
        .then(response => {
          console.log('search: goals search completed successfully, criteria:', params, 'results:', response.data);
          return response;
        })
        .catch(error => {
          console.error('search: goals search failed, criteria:', params);
          console.error('search: detailed error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: `${detectedApiUrl}/api/goals/search?${queryString}`
          });
          
          // If backend search endpoint doesn't exist, provide fallback behavior
          if (error.response?.status === 404) {
            console.warn('Search endpoint not found. Using fallback method.');
            // Return empty array as fallback
            return { data: [] };
          }
          
          throw error;
        });
    },
    generateGoalDeclaration: (goalData) => {
      try {
        const generateDeclarationText = (data) => {
          const formattedDate = data.targetDate ? new Date(data.targetDate).toLocaleDateString() : 'Date not set';
          const dailyTask = data.dailyTasks && data.dailyTasks.length > 0 ? data.dailyTasks[0] : 'daily commitment';
          const reward = data.rewards && data.rewards.length > 0 ? data.rewards[0] : 'appropriate reward';
          
          // Return declaration text template
          return `I commit to achieve ${data.title} by ${formattedDate}. 
                  Each day, I will ${dailyTask}.
                  When I reach my goal, I will reward myself with ${reward}.`;
        };
        
        // Generate and return the declaration content
        const declarationContent = generateDeclarationText(goalData);
        return {
          content: declarationContent,
          updatedAt: new Date()
        };
      } catch (error) {
        console.error('generateGoalDeclaration: error:', error);
        throw error;
      }
    },
  },

  // progress related
  progress: {
    getAll: (goalId) => api.get(`/api/progress?goalId=${goalId}`),
    getById: (id) => api.get(`/api/progress/${id}`),
    create: (progressData) => api.post("/api/progress", progressData),
    addRecord: (id, record) => api.post(`/api/progress/${id}/records`, record),
    updateCheckpoint: (id, checkpointId, status) =>
      api.put(`/api/progress/${id}/checkpoints/${checkpointId}`, { status }),
    getSummary: (goalId, startDate, endDate) =>
      api.get(
        `/api/progress/summary?goalId=${goalId}&startDate=${startDate}&endDate=${endDate}`
      ),
  },

  // report related
  reports: {
    generate: (goalId, startDate, endDate) => {
      console.log('reports: calling generate report API, goalId:', goalId, 'time range:', startDate, 'to', endDate);
      return api.post(`/api/reports/${goalId}`, { 
        timeRange: {
          startDate: startDate,
          endDate: endDate
        }
      }, {
        timeout: 60000 // 增加超时时间到60秒，原来是默认的10秒
      })
        .then(response => {
          console.log('reports: report generated successfully, response:', response);
          return response;
        })
        .catch(error => {
          console.error('reports: report generation failed, error:', error);
          // 如果是超时错误，可以在这里处理重试逻辑
          if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
            console.log('Request timed out, retrying...');
            // 这里可以添加重试逻辑，但需要注意避免无限重试
            // 简单起见，当前不自动重试，而是让用户手动重试
          }
          throw error;
        });
    },
    getLatest: (goalId) => api.get(`/api/reports/${goalId}/latest`),
    rate: (feedbackId, rating) => api.post(`/api/reports/${feedbackId}/rate`, { rating })
  }
};

export default apiService;