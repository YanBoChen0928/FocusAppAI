/* Description: Controller for user authentication and registration.
 * createTempUser: Create a temporary user account, when a user clicks "Continue as Guest" it creates
   - should use local storage to store the temp user ID if visited then no need to create a new temp user
 * getCurrentUser: Get current user information by ID, when a user logs in or registers
 * registerUser: Register a new user, when a user signs up, 
   - and if a tempId is provided when they click register or google oauth, migrate data from temp user
 * loginUser: Login user, when a user logs in
 * logoutUser: Logout user, when a user logs out
*/

import User from "../models/User.js";
import TempUser from "../models/TempUser.js";
import {
  generateUserToken,
  setTokenCookie,
  clearTokenCookie,
} from "../utils/jwtUtils.js";
// The JWT_SECRET should be defined in .env file
const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_for_development";

/**
 * Create a temporary user account
 *
 * This function:
 * 1. Generates a random tempId for the temporary user
 * 2. Creates a new temp user document in the database
 * 3. Returns the temp user information
 *
 * The created temp user will automatically expire after 21 days
 * (as configured in the TempUser model)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTempUser = async (req, res) => {
  try {
    // Generate a random tempId with "temp_" prefix and random string
    const tempId = `temp_${Math.random().toString(36).substring(2, 10)}`;

    // Create a new temp user in the database
    const tempUser = await TempUser.create({
      tempId,
    });

    // Return temp user data
    res.status(201).json({
      success: true,
      data: {
        tempId: tempUser.tempId,
        createdAt: tempUser.createdAt,
        expiresAt: tempUser.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error creating temporary user:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to create temporary user",
        details: error.message,
      },
    });
  }
};

/**
 * Get current user information by ID
 *
 * This function:
 * 1. Finds a user by the provided ID
 * 2. Returns the user information
 *
 * @param {Object} req - Express request object (containing userId in params)
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    // Check if the user is a registered or temporary user
    if (req.user.userType === "registered") {
      // Registered user: find user by ID
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: "User not found",
          },
        });
      }

      // Return user information
      return res.status(200).json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else if (req.user.userType === "temp") {
      // Temporary user: return guest user information
      return res.status(200).json({
        success: true,
        data: {
          id: req.user.tempId,
          username: "Guest User",
          isGuest: true,
        },
      });
    } else {
      // Invalid user type
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid user type",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch user information",
        details: error.message,
      },
    });
  }
};

/**
 * Register a new user
 *
 * This function:
 * 1. Validates registration data
 * 2. Checks if the email is already in use
 * 3. Creates a new user
 * 4. If a tempId is provided, migrates data from temp user
 * 5. Returns user info with JWT token
 *
 * @param {Object} req - Express request object with registration data
 * @param {Object} res - Express response object
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password, tempId } = req.body;
    
    console.log(`registerUser: starting user registration, email: ${email}, username: ${username}, tempId: ${tempId || 'none'}`);

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Please provide username, email and password" },
      });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`registerUser: email already in use, email: ${email}`);
      return res.status(400).json({
        success: false,
        error: { message: "Email is already in use" },
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
    });
    console.log(`registerUser: new user created successfully, ID: ${user._id}, email: ${email}`);

    // If tempId is provided, find and migrate temp user data
    if (tempId) {
      console.log(`registerUser: detected temp user ID: ${tempId}, preparing data migration`);
      try {
        const tempUser = await TempUser.findOne({ tempId });
        
        if (tempUser) {
          console.log(`registerUser: found temp user record, ID: ${tempUser._id}, tempId: ${tempId}`);
          
          // Associate tempId with the new user
          user.tempId = tempId;
          await user.save();
          console.log(`registerUser: associated tempId ${tempId} with user ${user._id}`);
          
          // target data migration
          console.log(`registerUser: starting data migration from temp user ${tempId} to registered user ${user._id}`);
          
          // import Goal model
          const Goal = await import("../models/Goal.js").then(module => module.default);
          console.log(`registerUser: loaded Goal model, preparing to query temp user goals`);
          
          // find all goals belong to the temp user
          const goals = await Goal.find({ userId: tempId });
          console.log(`registerUser: found ${goals.length} goals to migrate, goal IDs: ${goals.map(g => g._id).join(', ')}`);
          
          // check the type of userId field to solve potential issues
          if (goals.length > 0) {
            console.log(`registerUser: the type of userId field of the first goal: ${typeof goals[0].userId}, value: ${goals[0].userId}`);
            console.log(`registerUser: the structure of the Goal model: ${JSON.stringify(Goal.schema.paths.userId)}`);
          }
          
          // update the userId of each goal to the new registered user's ID
          let migratedCount = 0;
          for (const goal of goals) {
            console.log(`registerUser: migrating goal ${goal._id} from ${tempId} to ${user._id}`);
            // update the userId of each goal to the new registered user's ID
            goal.userId = user._id.toString();
            await goal.save();
            migratedCount++;
          }
          console.log(`registerUser: successfully migrated ${migratedCount}/${goals.length} goals`);
          
          // delete the temp user after successful migration
          await TempUser.findOneAndDelete({ tempId });
          console.log(`registerUser: temp user ${tempId} data migration completed and deleted`);
        } else {
          console.log(`registerUser: temp user not found, no data to migrate, tempId: ${tempId}`);
        }
      } catch (migrationError) {
        console.error("registerUser: error migrating temp user data:", migrationError);
        console.error(`registerUser: migration error details: ${migrationError.stack}`);
        // continue the registration process, do not interrupt due to migration error
      }
    }

    // Generate JWT token
    const token = generateUserToken(user._id);
    console.log(`registerUser: successfully generated user token, token: ${token}`);

    // Set JWT token as HttpOnly cookie
    setTokenCookie(res, token, 30 * 24 * 60 * 60 * 1000); // 30 days
    console.log(`registerUser: successfully set user token as HttpOnly cookie, 30 days valid`);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
    console.log(`registerUser: user registration completed, ID: ${user._id}`);
  } catch (error) {
    console.error("registerUser: error registering user:", error);
    console.error(`registerUser: registration error details: ${error.stack}`);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to register user",
        details: error.message,
      },
    });
  }
};

/**
 * Login user
 *
 * This function:
 * 1. Finds a user by email
 * 2. Validates password
 * 3. Returns user info with JWT token
 *
 * @param {Object} req - Express request object with login credentials
 * @param {Object} res - Express response object
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: "Please provide email and password" },
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid credentials" },
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateUserToken(user._id);

    // Set JWT token as HttpOnly cookie
    setTokenCookie(res, token, 30 * 24 * 60 * 60 * 1000); // 30 days

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to login",
        details: error.message,
      },
    });
  }
};

/**
 * Logout user
 *
 * This function:
 * 1. Clears the JWT token cookie
 * 2. Returns a success message
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logoutUser = (req, res) => {
  try {
    console.log(`User logging out: ${req.user?.userType === 'registered' ? req.user.id : req.user?.tempId}`);
    
    // Clear the JWT token cookie
    clearTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to logout",
        details: error.message,
      },
    });
  }
};

// Export controller functions
export {
  createTempUser,
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
};
