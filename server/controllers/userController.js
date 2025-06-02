/**
 * User Controller
 * 
 * This controller handles user profile operations:
 * - Getting user profile information
 * - Updating user profile
 * - Changing user password
 * - Deleting user account
 */

import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Get user profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    console.log("=== User Profile Request ===");
    console.log("User Type:", req.user?.userType);
    console.log("User ID:", req.user?.id);
    console.log("=====================");

    // Check user authentication status
    if (!req.user) {
      console.error("No user authentication information found");
      return res.status(401).json({
        success: false,
        error: {
          message: "Unauthorized access",
        },
      });
    }

    // Check user type
    if (req.user.userType !== 'registered') {
      console.error("Non-registered user attempting to access profile");
      return res.status(403).json({
        success: false,
        error: {
          message: "Only registered users can access their profile",
        },
      });
    }

    // Get the current user's ID
    const userId = req.user.id;

    // Find user by ID
    const user = await User.findById(userId).select('-password');

    if (!user) {
      console.error(`User with ID ${userId} not found`);
      return res.status(404).json({
        success: false,
        error: {
          message: "User does not exist",
        },
      });
    }

    console.log(`Successfully retrieved user profile: ${user.username}`);
    
    // Return user information
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to retrieve user profile",
        details: error.message,
      },
    });
  }
};

/**
 * Update user profile information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: { message: "Please provide username or email to update" }
      });
    }

    // Find and update user information
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" }
      });
    }

    // Update information
    if (username) user.username = username;
    if (email) user.email = email;
    
    await user.save();

    // Return updated user information
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to update user profile",
        details: error.message
      }
    });
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: "Please provide both current and new password" }
      });
    }

    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" }
      });
    }

    // Validate current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: "Current password is incorrect" }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to change password",
        details: error.message
      }
    });
  }
};

/**
 * Delete user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: "User not found" }
      });
    }

    // You can add logic here to delete user-related data
    // For example, deleting the user's goals, progress records, etc.

    res.status(200).json({
      success: true,
      message: "User account deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete user account",
        details: error.message
      }
    });
  }
};

export {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
};