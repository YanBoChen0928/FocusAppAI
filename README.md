# Focus - Minimalist Goal Tracker

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Demo](#demo)
- [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)
- [Data Model](#data-model)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Future Improvements](#future-improvements)
- [Contributors](#contributors)
- [License](#license)

## Project Overview

Focus is a comprehensive yet minimalist goal tracking application designed to help users set, track, and achieve their personal goals with clarity and consistency. The system addresses the common challenge of goal abandonment by providing users with a structured approach based on behavioral psychology principles.

Our application is built upon three core principles:

- **Simplicity First**: Minimalist interface removes distractions and cognitive load
- **Atomic Progress**: Break large goals into manageable daily actions
- **Positive Reinforcement**: Reward-based system to develop sustainable habits

Inspired by research in behavioral psychology and habit formation (particularly James Clear's "Atomic Habits" and B.J. Fogg's "Tiny Habits"), Focus encourages users to break down large ambitions into manageable daily actions and rewards, fostering a sustainable path towards success.

The core philosophy is **"Stay focused. Start small. Make it happen."** The application is designed to reduce friction in two key ways:

1. **Zero-barrier entry**: Users can begin tracking a goal without registration
2. **Progressive engagement**: Advanced features become available as users develop commitment

## Features

- **Guest Access**: Instant access without registration via a temporary user ID system, allowing immediate goal tracking with data persistence
- **Goal Setting Guide**: Intuitive step-by-step onboarding process that guides users through effective goal definition
- **Daily Progress Tracking**: Simple daily check-in system with journal functionality to record thoughts and obstacles
- **Weekly Calendar View**: Visual weekly overview of progress with color-coded indicators for completion status
- **Goal Declaration System**: Auto-generated personalized commitment statements based on goal details
- **AI-Powered Progress Analysis**: Natural language processing providing personalized insights and recommendations
- **Priority Management**: Visual priority indicators with quick-access adjustments (High/Medium/Low)
- **Target Date Tracking**: Deadline management with inline date picker for easy adjustments
- **Profile & Data Management**: Comprehensive account controls with privacy emphasis and data export options
- **Responsive Design**: Fully responsive interface that adapts to desktop, tablet, and mobile devices

## Demo

Website Application:

Check out our project demo video:
https://focusfinalproject-main-frontend.onrender.com/guest-login

[![Project Demo Video]](https://www.youtube.com/watch?v=RjQjvKvJodc)

## Technology Stack

### Frontend

- **Core**: React.js (built with Vite)
- **State Management**: Zustand (with devtools and persist middleware)
- **UI Framework**: Material UI (MUI Components, Icons, Date Pickers)
- **Routing**: React Router (react-router-dom)
- **HTTP Client**: Axios
- **Styling**: CSS Modules + Global CSS
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast
- **Linting**: ESLint

### Backend

- **Server**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), bcrypt, cookie-parser
- **AI Integration**: Hugging Face Inference API
- **Image Storage**: Cloudinary
- **Environment Management**: dotenv
- **Security**: CORS middleware, HTTP-only cookies

### Development & Deployment

- **Build Tool**: Vite
- **Version Control**: Git
- **Recommended Deployment**: Render (backend), Netlify/Vercel (frontend)

## API Documentation

Our application provides the following API endpoints:

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user

  - Request: `{ username, email, password }`
  - Response: `{ success, data: { user object minus password } }`

- `POST /api/auth/login` - User login

  - Request: `{ email, password }`
  - Response: `{ success, data: { user object minus password } }`
  - Sets HTTP-only JWT cookie

- `POST /api/auth/logout` - User logout

  - Response: `{ success, message }`
  - Clears JWT cookie

- `GET /api/auth/me/:userId` - Get current user data

  - Response: `{ success, data: { user object minus password } }`

- `POST /api/temp-users` - Create temporary guest user
  - Request: `{ optional initialization data }`
  - Response: `{ success, data: { tempId, etc. } }`

### Goal Management Endpoints

- `GET /api/goals/user/:userId` - Get all goals for a user

  - Response: `{ success, data: [goals] }`

- `POST /api/goals` - Create a new goal

  - Request: `{ userId, title, motivation, targetDate, ... }`
  - Response: `{ success, data: { created goal object } }`

- `GET /api/goals/:id` - Get specific goal details

  - Response: `{ success, data: { goal object } }`

- `PUT /api/goals/:id` - Update goal details

  - Request: `{ updated fields }`
  - Response: `{ success, data: { updated goal object } }`

- `DELETE /api/goals/:id` - Delete a goal

  - Response: `{ success, message }`

- `PUT /api/goals/:id/status` - Update goal status

  - Request: `{ status }`
  - Response: `{ success, data: { updated goal } }`

- `POST /api/goals/:id/checkpoints` - Add checkpoint to goal

  - Request: `{ title, isDaily }`
  - Response: `{ success, data: { updated goal with new checkpoint } }`

- `POST /api/goals/:id/daily-card` - Add/update daily progress card
  - Request: `{ date, dailyTask, dailyReward, etc. }`
  - Response: `{ success, data: { updated goal with daily card } }`

### Progress Tracking Endpoints

- `GET /api/progress?goalId=:goalId` - Get progress records for a goal

  - Response: `{ success, data: [progress records] }`

- `POST /api/progress` - Create progress record

  - Request: `{ goalId, completionRate, etc. }`
  - Response: `{ success, data: { created progress record } }`

- `POST /api/progress/:id/records` - Add daily record

  - Request: `{ date, completed, notes, mood }`
  - Response: `{ success, data: { updated progress } }`

- `PUT /api/progress/:id/checkpoints/:checkpointId` - Update checkpoint status

  - Request: `{ status }`
  - Response: `{ success, data: { updated progress } }`

- `GET /api/progress/summary?goalId=:goalId&startDate=:start&endDate=:end` - Get progress summary
  - Response: `{ success, data: { summary statistics } }`

### AI Reports Endpoints

- `POST /api/reports/:goalId` - Generate AI progress report

  - Request: `{ timeRange: { startDate, endDate } }`
  - Response: `{ success, data: { generated report } }`

- `GET /api/reports/:goalId/latest` - Get latest report

  - Response: `{ success, data: { most recent report } }`

- `POST /api/reports/:reportId/rate` - Rate report quality
  - Request: `{ rating }`
  - Response: `{ success, data: { updated report } }`

### File Upload Endpoints

- `POST /api/uploads/image` - Upload goal vision image

  - Request: multipart/form-data with image
  - Response: `{ success, data: { imageUrl } }`

- `POST /api/uploads/profile-image` - Upload user profile image
  - Request: multipart/form-data with image
  - Response: `{ success, data: { imageUrl } }`

## Data Model

Our application uses MongoDB as the database with the following collections:

### User Schema

```javascript
{
  _id: ObjectId,                // MongoDB document ID
  username: String,             // Display name
  email: {
    type: String,
    unique: true,               // Ensures email uniqueness
    required: true,
    lowercase: true,
    trim: true,
    validate: [isEmail]         // Email format validation
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false               // Excluded from query results by default
  },
  isGuest: {
    type: Boolean,
    default: false              // Distinguishes registered vs. temp users
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  profileImageUrl: String,
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      enabled: Boolean,
      email: Boolean,
      dailyReminder: Boolean,
      reminderTime: String      // HH:MM format
    }
  }
}
```

### Goal Schema

```javascript
{
  _id: ObjectId,                // MongoDB document ID
  userId: {                     // Reference to User or temporary ID
    type: String,
    required: true,
    index: true                 // Indexed for query performance
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: String,          // Optional longer description
  motivation: String,           // Why this goal matters
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'deleted'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  targetDate: Date,             // Goal completion target
  completedAt: Date,            // When goal was marked complete
  resources: [String],          // Available resources/support
  dailyTasks: [String],         // Daily actions to take
  rewards: [String],            // Rewards for completion
  visionImageUrl: String,       // URL to Cloudinary image
  declaration: {                // Generated commitment statement
    content: String,
    updatedAt: Date
  },
  checkpoints: [{               // Milestone tracking
    title: String,
    isCompleted: Boolean,
    isDaily: Boolean,           // Whether this is a recurring task
    completedAt: Date
  }],
  dailyCards: [{                // Daily progress records
    date: {
      type: Date,
      required: true
    },
    completed: {                // Task completion tracking
      type: Map,
      of: Boolean
    },
    dailyTask: String,          // Task for this specific day
    dailyReward: String,        // Reward for this specific day
    records: [{                 // Journal entries for this day
      text: String,
      timestamp: Date,
      mood: {
        type: String,
        enum: ['great', 'good', 'neutral', 'challenging', 'difficult']
      }
    }]
  }]
}
```

### Progress Schema

```javascript
{
  _id: ObjectId,
  goalId: {                     // Reference to parent Goal
    type: ObjectId,
    ref: 'Goal',
    required: true,
    index: true
  },
  userId: {                     // Duplicated for query efficiency
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true                 // Indexed for date-range queries
  },
  completionRate: Number,       // 0-100 percentage
  streakCount: Number,          // Current streak days
  longestStreak: Number,        // Historical best streak
  records: [{                   // Daily records
    date: Date,
    completed: Boolean,
    notes: String,
    mood: String,
    timeSpent: Number           // In minutes
  }],
  checkpointUpdates: [{         // Checkpoint progress
    checkpointId: ObjectId,
    status: Boolean,
    updatedAt: Date
  }]
}
```

### Report Schema

```javascript
{
  _id: ObjectId,
  goalId: {
    type: ObjectId,
    ref: 'Goal',
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  data: {
    completionRate: Number,
    streakData: {
      current: Number,
      longest: Number,
      average: Number
    },
    patternInsights: String,    // AI-generated pattern recognition
    suggestions: [String],      // AI-generated recommendations
    feedback: String,           // AI-generated encouragement
    analysisText: String        // Complete AI analysis
  },
  userRating: {                 // Optional feedback on report quality
    score: Number,              // 1-5 rating
    providedAt: Date
  }
}
```

### Relationships Between Collections

- Users to Goals: One-to-Many relationship (one user can have multiple goals)
- Goals to Progress: One-to-Many relationship (one goal can have multiple progress records)
- Goals to Reports: One-to-Many relationship (one goal can have multiple AI analysis reports)

## Installation

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher)
- MongoDB (local instance or MongoDB Atlas account)
- Hugging Face API key (for AI functionality)
- Cloudinary account (for image uploads)

### Steps

1. Clone the repository

   ```bash
   git clone <your-repository-url>
   cd FocusFinalProjectGitHub
   ```

2. Install backend dependencies

   ```bash
   cd server
   npm install
   ```

3. Set up backend environment variables

   - Create a `.env` file in the server directory with the following variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     PORT=5050
     JWT_SECRET=your_jwt_secret_key
     NODE_ENV=development
     CLIENT_URL=http://localhost:5173
     HUGGING_FACE_API_KEY=your_huggingface_api_key
     # Optional Cloudinary config if using image uploads
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```

4. Install frontend dependencies

   ```bash
   cd ../client
   npm install
   ```

5. Set up frontend environment variables

   - Create a `.env.development` file in the client directory:
     ```
     VITE_API_URL=http://localhost:5050
     ```

6. Start the development servers

   ```bash
   # In the server directory
   npm run dev

   # In the client directory (in a new terminal)
   npm run dev
   ```

7. Access the application
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5050

## Usage

Focus offers an intuitive user experience designed to minimize friction and maximize engagement. Here's how to use the key features:

### Guest Access & User Registration

1. On the landing page, click "Try it instantly" to create a temporary account without registration
2. To create a permanent account later, go to the profile section and click "Convert to Registered Account"
3. For direct registration, use the "Sign Up" option on the landing page or login screen

### Goal Setting (First-time User)

1. First-time users are automatically guided through the onboarding flow
2. Enter your goal title (be specific and action-oriented)
3. Define why this goal matters to you (motivation)
4. List resources you already have to help you succeed
5. Define a small daily action (typically requiring <15 minutes)
6. Set up a reward system for completing daily tasks
7. Choose a target completion date
8. Optionally upload a visual representation of your goal

### Dashboard Navigation

1. **Sidebar**: Browse and select goals, manage priorities, adjust dates
2. **Goal Details**: View and edit your selected goal's details, track daily progress
3. **Progress Report**: View AI-generated insights (available on desktop/wider screens)

### Daily Progress Tracking

1. Select your goal from the sidebar
2. In the Goal Details panel, click on today's card in the weekly view
3. Check off your daily task completion
4. Add notes about your progress, challenges, or insights
5. Save your progress

### Generating AI Reports

1. Select your goal
2. In the Progress Report panel, choose a time range (7 days, 30 days, or custom)
3. Click "Generate Report"
4. Review the AI-generated insights and suggestions
5. Optionally export the report as PDF

### Managing Multiple Goals

1. Click the "Add Goal" button in the sidebar
2. Complete the goal setup process
3. Use the priority indicators (High/Medium/Low) to rank your goals
4. Archive completed goals by selecting "Archive" from the goal menu

## Project Structure

```
FocusFinalProjectGitHub/
├── client/                     # React Frontend (Vite)
│   ├── public/                 # Static assets
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable UI components
│   │   │   ├── GoalDetails/    # Goal detail components
│   │   │   │   ├── DailyCard.jsx
│   │   │   │   ├── GoalDeclaration.jsx
│   │   │   │   ├── WeeklyDailyCards.jsx
│   │   │   ├── GoalSettingGuide/ # Onboarding components
│   │   │   ├── Header/         # App header components
│   │   │   ├── ProgressReport/ # Progress analysis components
│   │   │   │   ├── AIFeedback.jsx
│   │   │   │   ├── ExportButton.jsx
│   │   │   ├── Sidebar/        # Sidebar components
│   │   │   │   ├── GoalCard.jsx
│   │   │   ├── AuthProtected.jsx # Auth wrapper component
│   │   │   ├── OnboardingModal.jsx # First-time user flow
│   │   │   ├── ProfileModal.jsx   # User profile management
│   │   ├── pages/              # Page-level components
│   │   │   ├── Home.jsx        # Main dashboard
│   │   │   ├── Login.jsx       # Authentication pages
│   │   │   ├── Register.jsx
│   │   │   ├── GuestLogin.jsx  # Temporary user entry
│   │   │   ├── Profile.jsx     # User profile page
│   │   ├── services/           # API service layer
│   │   │   └── api.js          # Axios instance with interceptors
│   │   ├── store/              # Zustand state stores
│   │   │   ├── userStore.js    # User authentication state
│   │   │   ├── reportStore.js  # AI reports cache
│   │   │   ├── mainTaskStore.js # Goal tasks state
│   │   ├── styles/             # CSS and styling
│   │   ├── theme/              # MUI theme customization
│   │   ├── utils/              # Helper functions
│   │   ├── App.jsx             # Main component & routing
│   │   ├── App.css             # Global styles
│   │   └── main.jsx            # Application entry
│   ├── .env.production         # Production variables
│   ├── eslint.config.js        # Linting rules
│   ├── index.html              # HTML entry
│   ├── package.json            # Dependencies & scripts
│   └── vite.config.js          # Build configuration
│
└── server/                     # Node.js Backend (Express)
    ├── config/                 # Configuration files
    │   ├── db.js               # MongoDB connection
    ├── controllers/            # Request handlers
    │   ├── authController.js   # Authentication logic
    │   ├── goalsController.js  # Goal management
    │   ├── progressController.js # Progress tracking
    │   ├── reportsController.js  # AI reports
    ├── middleware/             # Express middleware
    │   ├── auth.js             # Authentication & authorization
    │   ├── errorHandler.js     # Global error handling
    ├── models/                 # Mongoose data models
    │   ├── User.js             # User account schema
    │   ├── Goal.js             # Goal definition schema
    │   ├── Progress.js         # Progress tracking schema
    │   ├── Report.js           # AI report schema
    ├── routes/                 # API endpoint definitions
    │   ├── auth.js             # Auth routes
    │   ├── goals.js            # Goal management routes
    │   ├── progress.js         # Progress tracking routes
    │   ├── reports.js          # AI analysis routes
    │   ├── tempUserRoutes.js   # Guest access routes
    │   ├── uploads.js          # File upload routes
    ├── services/               # Business logic services
    │   ├── ReportService.js    # AI report generation
    ├── utils/                  # Helper functions
    ├── .env                    # Environment variables
    ├── app.js                  # Express configuration
    ├── package.json            # Backend dependencies
    └── server.js               # Server entry point
```

## Testing

Our project includes a testing framework to ensure reliability and functionality:

### Running Tests

```bash
# For backend tests
cd server
npm test

# For frontend tests
cd client
npm test
```

### Test Coverage

- Unit Tests: Frontend components and utility functions
- Integration Tests: API endpoint functionality and data flow
- End-to-End Tests: Key user flows including registration, goal creation, and progress tracking

## Accessibility

Focus is designed with accessibility in mind, striving to meet WCAG 2.1 AA standards:

### Accessibility Features

- Semantic HTML structure throughout the application
- ARIA attributes where necessary for complex interactive elements
- Keyboard navigation support for all interactive elements
- Color contrast ratios meeting AA standards
- Screen reader compatibility with descriptive alt text and labels
- Responsive design that works across devices and screen sizes
- Focus indicators for keyboard users

## Future Improvements

We plan to enhance the application with the following features:

- **Social Accountability**: Optional goal sharing and accountability partner system
- **Advanced Analytics**: Machine learning-based predictions and deeper behavioral insights
- **Integration Ecosystem**: Calendar integration (Google, Apple) and task manager connections
- **Mobile Applications**: Native iOS and Android apps with offline functionality
- **Enterprise Features**: Team goals, manager dashboards, and organization analytics
- **Gamification Elements**: Achievement badges, streaks visualization, and milestone celebrations
- **Extended AI Capabilities**: More personalized feedback and adaptive challenge suggestions

## Contributors

- Ryan Tian
- Yanbo Chen
- Neda Changizi - Instructor

## License

This project is licensed under the MIT License - see the LICENSE file for details.
