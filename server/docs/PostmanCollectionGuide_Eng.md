# Postman Collection Guide for Focus App API

## User Models in Focus App

The application has two user storage systems:

1. **User Model** (users collection)

   - Contains only formally registered users
   - Registered users: have email/password or googleID
   - Stored in the users collection
   - Can create up to 4 goals (default 3): bonus 1
   - Registered users can use all features long-term
   - Supports different roles: 'regular' (default), 'premium', 'admin'
   - Account password authentication via Google API requires conversion storage (may need Google API)

2. **TempUser Model** (temp_users collection)
   - Completely independent temporary data storage
   - Can only create one goal
   - Automatically expires after 21 days
   - Used for initial experience, can be converted to registered user
   - Uses tempId for identification, mainly needed for conversion to registered user

## Detailed API Endpoints

### 1. User Management

#### Register User

- **Endpoint**: `POST /api/auth/register`
- **Purpose**: Create a new registered user account
- **Parameters**:
  - username: Username
  - email: Email address (unique)
  - password: Password (will be encrypted for storage)
  - tempId: (optional) To associate TempUser data
- **Use Case**: Creating a new account or converting from TempUser to registered account

#### Login User

- **Endpoint**: `POST /api/auth/login`
- **Purpose**: User login and obtaining JWT authentication token
- **Parameters**:
  - email: Email address
  - password: Password
- **Use Case**: Registered users logging into the system

#### Get User Info

- **Endpoint**: `GET /api/auth/me/:userId`
- **Purpose**: Get detailed information for a specific user
- **Parameters**:
  - userId: User ID (URL parameter)
- **Use Case**: Getting information for logged-in or guest users

### 2. TempUser API

#### Create Temp User

- **Endpoint**: `POST /api/temp-users`
- **Purpose**: Create a new temporary user record (stored in temp_users collection). Created when clicking "Enter as Guest".
- **Parameters**:
  - tempId: Unique identifier for temporary user (optional, auto-generated if not provided)
- **Use Case**: Providing a 21-day trial with a maximum of one goal for first-time users.

#### Get Temp User

- **Endpoint**: `GET /api/temp-users/:tempId`
- **Purpose**: Get information for a specified temporary user
- **Parameters**:
  - tempId: Temporary user ID (URL parameter)
- **Use Case**: Querying basic information and goals for a temporary user

#### Add Goal to Temp User

- **Endpoint**: `POST /api/temp-users/:tempId/goals`
- **Purpose**: Create a goal for a temporary user (limit one)
- **Parameters**:
  - tempId: Temporary user ID (URL parameter)
  - title: Goal title
  - description: Goal description
- **Use Case**: Temporary user wants to set up a simple goal to track

### 3. User Profile Management

#### Get User Profile

- **Endpoint**: `GET /api/users/profile`
- **Purpose**: Get profile information for the logged-in user
- **Use Case**: View and manage user profile page

#### Update User Profile

- **Endpoint**: `PUT /api/users/profile`
- **Purpose**: Update user's basic profile information
- **Parameters**:
  - username: New username (optional)
  - email: New email address (optional)
- **Use Case**: User modifying their profile information

#### Change Password

- **Endpoint**: `PUT /api/users/password`
- **Purpose**: Change user login password
- **Parameters**:
  - currentPassword: Current password
  - newPassword: New password
- **Use Case**: User needs to change their login password

#### Delete Account

- **Endpoint**: `DELETE /api/users/account`
- **Purpose**: Permanently delete user account and related data
- **Use Case**: User wants to completely delete their account

### 4. Goal Management

#### Create Goal

- **Endpoint**: `POST /api/goals`
- **Purpose**: Create a new goal for a user
- **Parameters**:
  - userId: User ID
  - title: Goal title
  - description: Goal description
  - priority: Priority (optional)
  - deadline: Deadline (optional)
- **Use Case**: User wants to create a new goal to track

#### Get User Goals

- **Endpoint**: `GET /api/goals/user/:userId`
- **Purpose**: Get all goals for a specified user
- **Parameters**:
  - userId: User ID (URL parameter)
- **Use Case**: View a list of all goals created by a user

#### Get Goal Details

- **Endpoint**: `GET /api/goals/detail/:id`
- **Purpose**: Get detailed information for a specific goal
- **Parameters**:
  - id: Goal ID (URL parameter)
- **Use Case**: View complete information for a single goal

#### Update Goal

- **Endpoint**: `PUT /api/goals/:id`
- **Purpose**: Update basic information for an existing goal
- **Parameters**:
  - id: Goal ID (URL parameter)
  - title: New goal title (optional)
  - description: New goal description (optional)
  - priority: New priority (optional)
- **Use Case**: Modify basic information for a goal

#### Update Goal Status

- **Endpoint**: `PUT /api/goals/:id/status`
- **Purpose**: Update the status of a goal (e.g., in progress, completed)
- **Parameters**:
  - id: Goal ID (URL parameter)
  - status: New status value
- **Use Case**: Mark a goal's completion status

#### Add Goal Checkpoint

- **Endpoint**: `POST /api/goals/:id/checkpoints`
- **Purpose**: Add a milestone or checkpoint for a goal
- **Parameters**:
  - id: Goal ID (URL parameter)
  - title: Checkpoint title
  - description: Checkpoint description (optional)
  - targetDate: Target completion date (optional)
- **Use Case**: Break down a goal into manageable steps

#### Update Goal Declaration

- **Endpoint**: `PUT /api/goals/:id/declaration`
- **Purpose**: Update the declaration or vision statement for a goal
- **Parameters**:
  - id: Goal ID (URL parameter)
  - content: Declaration content
  - vision: Vision description (optional)
- **Use Case**: Help users clarify the meaning and motivation for their goal

#### Delete Goal

- **Endpoint**: `DELETE /api/goals/:id`
- **Purpose**: Permanently delete a goal
- **Parameters**:
  - id: Goal ID (URL parameter)
- **Use Case**: User needs to remove a goal that is no longer needed

### 5. Progress Tracking

#### Create Progress Record

- **Endpoint**: `POST /api/progress`
- **Purpose**: Create a new progress record for a goal
- **Parameters**:
  - goalId: Goal ID
  - userId: User ID
  - records: Array of progress records (including content, duration, mood, etc.)
- **Use Case**: Record user progress on a goal

#### Get Goal Progress

- **Endpoint**: `GET /api/progress?goalId=X`
- **Purpose**: Get all progress records for a specific goal
- **Parameters**:
  - goalId: Goal ID (query parameter)
- **Use Case**: View all historical progress records for a goal

#### Update Progress Record

- **Endpoint**: `PUT /api/progress/:id`
- **Purpose**: Update an existing progress record
- **Parameters**:
  - id: Progress record ID (URL parameter)
  - records: Updated array of records (optional)
  - summary: Progress summary (optional)
- **Use Case**: Modify a previously created progress record

#### Add Record Item

- **Endpoint**: `POST /api/progress/:id/records`
- **Purpose**: Add a new item to an existing progress record
- **Parameters**:
  - id: Progress record ID (URL parameter)
  - content: Record content
  - duration: Duration (minutes)
  - mood: Emotional state (optional)
- **Use Case**: Add a record without creating a new progress record

#### Update Checkpoint Status

- **Endpoint**: `PUT /api/progress/:id/checkpoints/:checkpointId`
- **Purpose**: Update the completion status of a checkpoint
- **Parameters**:
  - id: Progress record ID (URL parameter)
  - checkpointId: Checkpoint ID (URL parameter)
  - isCompleted: Completion status (boolean)
- **Use Case**: Mark completion status of goal checkpoints

#### Get Progress Summary

- **Endpoint**: `GET /api/progress/summary`
- **Purpose**: Get a summary of goal progress for a specific time period
- **Parameters**:
  - goalId: Goal ID (query parameter)
  - startDate: Start date (query parameter)
  - endDate: End date (query parameter)
- **Use Case**: View statistics and trend analysis for goal progress

### 6. Report Management

#### Generate Report

- **Endpoint**: `POST /api/reports/generate`
- **Purpose**: Generate a goal report based on progress records
- **Parameters**:
  - goalId: Goal ID
  - userId: User ID
  - type: Report type (e.g., weekly, monthly)
  - period: Report time period (including startDate and endDate)
- **Use Case**: Create a summary report of goal progress

#### Get Reports for Goal

- **Endpoint**: `GET /api/reports?goalId=X`
- **Purpose**: Get all reports for a specific goal
- **Parameters**:
  - goalId: Goal ID (query parameter)
- **Use Case**: View historical reports for a goal

#### Get Report Details

- **Endpoint**: `GET /api/reports/:id`
- **Purpose**: Get detailed content for a specific report
- **Parameters**:
  - id: Report ID (URL parameter)
- **Use Case**: View complete information for a single report

#### Update Report Content

- **Endpoint**: `PUT /api/reports/:id`
- **Purpose**: Update content for an existing report
- **Parameters**:
  - id: Report ID (URL parameter)
  - content: Report content
  - insights: Insights array (optional)
  - recommendations: Recommendations array (optional)
- **Use Case**: Modify or enrich automatically generated reports

#### Delete Report

- **Endpoint**: `DELETE /api/reports/:id`
- **Purpose**: Permanently delete a report
- **Parameters**:
  - id: Report ID (URL parameter)
- **Use Case**: Remove a report that is no longer needed

#### Export Report as PDF

- **Endpoint**: `GET /api/export/reports/:id/pdf`
- **Purpose**: Export a report as PDF format
- **Parameters**:
  - id: Report ID (URL parameter)
- **Use Case**: Save or share a report in printable format

## Differences and Conversion Between User and TempUser

### Key Differences

- **User (all users registered via account/password or Google API authentication)**:

  - Stored in the users collection
  - Can create up to 4 goals (default 3): bonus 1
  - Registered users can use all features long-term
  - Supports user role management: 'regular' (default), 'premium', 'admin'
  - Account password using Google API authentication requires conversion storage (may need Google API)

- **TempUser**:
  - Stored in the temp_users collection
  - Can only create one goal
  - Automatically deleted after 21 days
  - No role distinction, operates with basic limitations

### Data Conversion Process

1. When a TempUser decides to register, first create a formal User
2. Use the link-temp API to associate the TempUser and newly created User
3. The system migrates the TempUser's goal data to the User
4. TempUser data is eventually automatically deleted by the system

#### Data Conversion Example Code

1. **Integration into the Registration Process**

   - The `POST /api/auth/register` endpoint already includes an optional `tempId` parameter
   - When a user registers, the backend can directly check if a `tempId` was provided, and if so, automatically handle data migration

2. **Simplified User Experience**

   - Users don't need to perform a separate "association" operation after registration
   - The entire process is smoother for users, reducing operational steps

3. **Frontend Implementation**
   - The frontend can store the `tempId` in localStorage or a cookie during the temporary user's usage period
   - When the user decides to register, automatically retrieve the `tempId` from local storage and include it in the registration request

### Recommended Implementation Method

```javascript
// Registration endpoint is sufficient for handling data migration
POST /api/auth/register
{
  username: "username",
  email: "email",
  password: "password",
  tempId: "temp_12345" // Retrieved from local storage, if it exists
}
```

Backend processing logic:

1. Create a new user
2. Check if a `tempId` was provided
3. If yes, look for corresponding temporary user data
4. Transfer the temporary user's data to the newly created user
5. Delete or mark the temporary user data as migrated

This design is more concise, reduces the number of API endpoints, and simplifies the entire user experience flow. Unless you have special requirements (such as needing to associate temporary data at some point after user registration), a separate `link-temp` endpoint may be redundant.

## Application Security Testing Guide

To verify the security of the application, perform the following tests:

### 1. API Authentication Testing

**Purpose**: Ensure protected routes can only be accessed by authenticated users.

**Steps**:
1. Use Postman to access protected routes (such as `/api/progress` or `/api/users/profile`) without logging in
2. Confirm you receive a 401 Unauthorized error response
3. Log in as a temporary or registered user and try accessing the same route again
4. Confirm successful access and receipt of expected data

**Verification**:
- Returns 401 status code when not logged in
- Returns 200 status code and requested data after logging in

### 2. Resource Ownership Testing

**Purpose**: Ensure users can only access and modify resources that belong to them.

**Steps**:
1. Create two different users (can be temporary or registered users)
2. Have User A create a goal or progress record
3. Attempt to access or modify User A's resources using User B's authentication
4. Confirm you receive a 403 Forbidden error

**Verification**:
- Returns 403 status code when a user attempts to access resources that don't belong to them
- Error message clearly indicates permission is denied

### 3. Rate Limiting Testing

**Purpose**: Ensure the API is protected against abuse and denial of service attacks.

**Steps**:
1. Repeatedly make the same request in a short period (e.g., login attempts or temporary user creation)
2. Continue sending requests until you exceed the configured limit
3. Observe response headers and error messages

**Verification**:
- Returns 429 status code (Too Many Requests) after exceeding the limit
- Response headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` information
- Error message provides information on when to try again

### 4. Error Handling Testing

**Purpose**: Ensure the application handles errors consistently and securely.

**Steps**:
1. Send requests missing required fields (e.g., a registration request without a password)
2. Send incorrectly formatted data (e.g., invalid date format)
3. Attempt to access non-existent routes (e.g., `/api/non-existent-route`)

**Verification**:
- Returns 400 status code for missing fields or incorrectly formatted data
- Returns 404 status code for non-existent routes
- Error responses use a standard format:
  ```json
  {
    "success": false,
    "error": {
      "message": "specific error message"
    }
  }
  ```

## Usage Instructions

1. For general use cases, first test registered user registration and temporary user functionality
2. Test the TempUser API, especially the user conversion process from temporary to registered
3. Test in the order provided in the collection, creating users first, then goals
4. Store returned IDs in variables for use in subsequent requests
5. After completing basic functionality testing, run the test cases in the security testing section 