# Focus - Smart Goal Tracking System (with Data Flow) (Updated 2025-06-08)

## Project Architecture & Data Flow

### System Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│ Client (React)  │ ◄────► │ Server (Node)   │ ◄────► │ DB (MongoDB)    │
│                 │   API   │                 │  Query  │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### User Authentication Flow

```
┌──────────────┐   1. Visit    ┌───────────────┐
│              │───────────►   │               │
│  Guest User  │               │ Temp User     │
│              │◄──────────    │ Creation      │
└──────────────┘  2. tempId    └───────────────┘
       │                              │
       │ 3. Decide to register        │
       ▼                              │
┌──────────────┐   4. Convert   ┌───────────────┐
│              │◄──────────    │               │
│ Registered   │               │ Temp Data     │
│ User         │───────────►   │ Migration     │
└──────────────┘  5. userId    └───────────────┘
```

### Goal Management Flow

```
┌──────────────┐   1. Create Goal  ┌───────────────┐
│              │───────────────►   │               │
│    User      │                   │  Goal Storage │
│ (ID/tempID)  │◄──────────────    │               │
└──────────────┘   2. Goal Data    └───────────────┘
       │                                 │
       │ 3. Daily Tasks                  │
       ▼                                 ▼
┌──────────────┐   4. Update Prog. ┌───────────────┐
│              │───────────────►   │               │
│  Progress    │                   │  Progress     │
│  Tracking    │◄──────────────    │  Records      │
└──────────────┘   5. Prog. Data   └───────────────┘
       │                                 │
       │ 6. Analysis Request             │
       ▼                                 ▼
┌──────────────┐   7. Gen Report   ┌───────────────┐
│              │◄──────────────    │               │
│   Report     │                   │  Report       │
│   Display    │                   │  Storage      │
└──────────────┘                   └───────────────┘
```

## Core Components and Data Flow

### Frontend Core Components

1. **Home.jsx** - Home page/Dashboard
   - Location: `src/pages/Home.jsx`
   - Data source: `userStore`, `mainTaskStore`
   - Child components: Sidebar, GoalDetails, ProgressReport
   - Data flow: Load user data → Get goal list → Render goal details

2. **GoalSettingGuide** - Goal setting wizard
   - Location: `src/components/GoalSettingGuide/`
   - Data source: Form inputs, `mainTaskStore`
   - Data flow: Collect user input → Call API to create goal → Update state

3. **DailyCard** - Daily progress card
   - Location: `src/components/GoalDetails/DailyCard.jsx`
   - Data source: `mainTaskStore`, goal details
   - Data flow: Display daily tasks → Record completion status → Submit API update

4. **ProgressReport** - AI-powered analysis
   - Location: `src/components/ProgressReport/AIFeedback.jsx`
   - Data source: `reportStore`, goal progress data
   - AI Service: OpenAI ChatGPT 3.5 API
   - Data flow: Collect progress data → Generate AI analysis → Display insights

### Frontend State Management Flow

```
┌──────────────────────┐
│    Zustand Stores    │
├──────────────────────┤
│                      │
│  ┌───────────────┐   │      ┌────────────────┐
│  │  userStore    │◄──┼─────►│  Auth Data     │
│  └───────────────┘   │      └────────────────┘
│                      │
│  ┌───────────────┐   │      ┌────────────────┐
│  │mainTaskStore  │◄──┼─────►│  Goal Task Data│
│  └───────────────┘   │      └────────────────┘
│                      │
│  ┌───────────────┐   │      ┌────────────────┐
│  │reportStore    │◄──┼─────►│  Report Data   │
│  └───────────────┘   │      └────────────────┘
│                      │
│  ┌───────────────┐   │      ┌────────────────┐
│  │rewardsStore   │◄──┼─────►│  Reward Data   │
│  └───────────────┘   │      └────────────────┘
│                      │
└──────────────────────┘
         │  │
         │  │
         ▼  ▼
┌──────────────────────┐
│   React Components   │
└──────────────────────┘
```

### Backend Core Services

1. **AuthService** - Authentication handling
   - Location: `server/services/AuthService.js`
   - Dependencies: JWT, bcrypt
   - Data flow: Validate credentials → Generate tokens → Manage sessions

2. **GoalService** - Goal management
   - Location: `server/services/GoalService.js`
   - Dependencies: MongoDB, Mongoose
   - Data flow: Process goal operations → Update database → Return results

3. **ReportService** - AI analysis generation
   - Location: `server/services/ReportService.js`
   - Dependencies: OpenAI API, Progress model
   - Data flow: Gather progress data → Generate AI insights → Store report

### API Endpoints and Data Flow

| Endpoint | Function | Data Flow |
|------|------|---------|
| POST /api/auth/register | User registration | Frontend→Backend→Database(User) |
| POST /api/auth/login | User login | Frontend→Backend→Database(User)→Frontend(JWT) |
| POST /api/temp-users | Create temporary user | Frontend→Backend→Database(TempUser)→Frontend(tempId) |
| GET /api/goals/user/:userId | Get user goals | Frontend→Backend→Database(Goal)→Frontend |
| POST /api/goals | Create goal | Frontend→Backend→Database(Goal)→Frontend |
| PUT /api/goals/:id | Update goal | Frontend→Backend→Database(Goal)→Frontend |
| POST /api/goals/:id/daily-card | Add daily progress | Frontend→Backend→Database(Goal.dailyCards)→Frontend |
| GET /api/progress?goalId=:goalId | Get progress records | Frontend→Backend→Database(Goal)→Frontend |
| POST /api/reports/:goalId | Generate AI report | Frontend→Backend→Database(Goal)→Report Service→Database(Report)→Frontend |

### Additional Documentation

The project includes supplementary documentation:

1. **State Management** (`stateManagement.md`)
   - Zustand store configuration
   - State update patterns
   - Data persistence strategy

2. **Reward System** (`reward-sync-implementation.txt`)
   - Reward calculation logic
   - Synchronization mechanism
   - User motivation patterns

3. **API Documentation**
   - Comprehensive Postman collections
   - Endpoint specifications
   - Request/Response examples

[Complete remaining sections from original READMEwithDATAFLOW.md] 