// Description: Main server file for the Express.js backend. first part: as the door to the restaurant

// Ensure dotenv is loaded at the beginning
import dotenv from "dotenv";
// Load environment variables immediately
dotenv.config();

// Add environment variables check
console.log("=== Environment Variables Check ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not Set");
console.log("Cloudinary Config Status:", 
  !!(process.env.CLOUDINARY_CLOUD_NAME && 
     process.env.CLOUDINARY_API_KEY && 
     process.env.CLOUDINARY_API_SECRET) ? "Complete" : "Incomplete");
console.log("=======================");

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

// import routes
import authRoutes from "./routes/auth.js";
import tempUserRoutes from "./routes/tempUserRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadsRoutes from "./routes/uploads.js"; // Add upload routes
// add other routes import as needed

// import directly for routes that are immediately used
import goalsRoutes from "./routes/goals.js";
import progressRoutes from "./routes/progress.js";
import reportsRoutes from './routes/reports.js'; // Add import

// connect to MongoDB
connectDB();

const app = express();

// CORS Configuration - Using function version for more flexibility
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173", 
      "http://localhost:5174",  // Add backup port for local Vite dev server
      "http://localhost:5175",  // Add more local ports
      "https://focusappdeploy-frontend.onrender.com", 
      "https://focusfinalproject-frontend-original.onrender.com", 
      "https://focusfinalproject-frontend-original-repo.onrender.com",
      "https://focusfinalproject-main-frontend.onrender.com"
    ];
    
    // Add CLIENT_URL from environment variable if available
    if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
      allowedOrigins.push(process.env.CLIENT_URL);
    }
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"]
}));

// Add a middleware to log every request for debugging CORS issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request received:`, {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    host: req.headers.host
  });
  
  // Add CORS headers directly as a backup
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// Log CORS configuration (for debugging)
console.log("=== CORS Configuration ===");
console.log("Using simplified CORS with direct origins");
console.log("=======================");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set port from environment variables or use default
const PORT = process.env.PORT || 5050;

// Routes
// Auth routes - handles user authentication (including guest login)
app.use("/api/auth", authRoutes);

// Goals routes - handles goal management
app.use("/api/goals", goalsRoutes);

// Progress routes - handles progress tracking
app.use("/api/progress", progressRoutes);

// Temp User routes - handles temporary user management
app.use("/api/temp-users", tempUserRoutes);

// User routes - handles user profile management
app.use("/api/users", userRoutes);

// Uploads routes - handles file uploads to Cloudinary
app.use("/api/uploads", uploadsRoutes);

// Reports routes - handles AI report generation
app.use("/api/reports", reportsRoutes);

// Health check endpoint - for client to verify API availability
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test API - simple endpoint to verify server is running
app.get("/", (req, res) => {
  res.send("Hello from Express Server!");
});

// CORS test endpoint - to verify CORS is working
app.get("/api/test-cors", (req, res) => {
  res.json({
    success: true, 
    message: "CORS is working correctly",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "resource not found",
    },
  });
});

// Connect to MongoDB & start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully!");
    
    // Wait for connection to be fully ready before proceeding
    await new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 10000); // 10 second timeout
        
        mongoose.connection.on('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });
    
    // Handle collection indexes with improved error handling
    try {
      const db = mongoose.connection.db;
      
      // Check if database connection is ready
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      console.log("Start checking and removing all possible unique indexes...");
      
      // Add retry mechanism for listCollections
      let collections;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          collections = await db.listCollections().toArray();
          break; // Success, exit retry loop
        } catch (listError) {
          retryCount++;
          console.log(`Attempt ${retryCount} to list collections failed:`, listError.message);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to list collections after ${maxRetries} attempts: ${listError.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const goalsCollectionExists = collections.some(col => col.name === 'goals');
      
      if (goalsCollectionExists) {
        // Get all indexes on the goals collection with retry
        let indexes;
        retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            indexes = await db.collection('goals').indexes();
            break;
          } catch (indexError) {
            retryCount++;
            console.log(`Attempt ${retryCount} to get indexes failed:`, indexError.message);
            
            if (retryCount >= maxRetries) {
              console.warn(`Failed to get indexes after ${maxRetries} attempts, skipping index operations`);
              indexes = [];
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log("Existing indexes:", JSON.stringify(indexes));
        
        // Define indexes to be dropped
        const indexesToDrop = [
          'userId_1_title_1', 
          'title_1_userId_1',
          'title_1',
          'userId_1_title_1_unique'
        ];
        
        // Attempt to drop each index with individual error handling
        for (const indexName of indexesToDrop) {
          try {
            await db.collection('goals').dropIndex(indexName);
            console.log(`Successfully deleted index: ${indexName}`);
          } catch (err) {
            console.log(`Attempted to delete index ${indexName}: ${err.message}`);
            // Continue with next index, don't fail the entire process
          }
        }
        
        // Create new non-unique index with error handling
        try {
          await db.collection('goals').createIndex(
            { userId: 1, title: 1 }, 
            { unique: false, background: true }
          );
          console.log("Successfully rebuilt non-unique index");
        } catch (createIndexError) {
          console.warn("Failed to create new index:", createIndexError.message);
          // Don't fail server startup for index creation issues
        }
      } else {
        console.log("Goals collection does not exist yet, skipping index cleanup");
      }
      
    } catch (indexError) {
      console.warn("Error during index processing:", indexError.message);
      console.warn("Continuing server startup despite index issues...");
      // Continue execution, don't block server startup due to index issues
    }
    
    // Check if port is in use and try alternative ports
    const startServer = (port) => {
      try {
        const server = app.listen(port, () => {
          console.log(`Server is running on port ${port}!`);
          console.log("MongoDB connection status:", mongoose.connection.readyState === 1 ? "Connected" : "Disconnected");
        });
        
        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}`);
            startServer(port + 1);
          } else {
            console.error('Server error:', error);
          }
        });
      } catch (error) {
        console.error('Server startup error:', error);
      }
    };
    
    startServer(PORT);
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    console.error("Server startup failed due to MongoDB connection issues");
    
    // Attempt to start server anyway for debugging purposes
    console.log("Attempting to start server without MongoDB...");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (without MongoDB)!`);
    });
  });
