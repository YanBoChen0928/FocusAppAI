/**
 * Utility functions for JWT token generation and verification
 */
import jwt from "jsonwebtoken";

// The JWT_SECRET should be defined in .env file
const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_for_development";

/**
 * Generate JWT token for a registered user
 *
 * @param {String} userId - User ID to include in token payload
 * @returns {String} JWT token
 */
const generateUserToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      userType: "registered",
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/**
 * Generate JWT token for a temporary user
 *
 * @param {String} tempId - Temporary user ID to include in token payload
 * @returns {String} JWT token
 */
const generateTempToken = (tempId) => {
  return jwt.sign(
    {
      tempId: tempId,
      userType: "temp",
    },
    JWT_SECRET,
    { expiresIn: "14d" }
  );
};

/**
 * Verify JWT token and extract payload
 *
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
};

/**
 * Set JWT token as HttpOnly cookie
 *
 * @param {Object} res - Express response object
 * @param {String} token - JWT token to set as cookie
 * @param {Number} maxAge - Cookie max age in milliseconds
 */
const setTokenCookie = (res, token, maxAge) => {
  // 輸出 cookie 設置信息
  console.log("設置 JWT cookie：", {
    環境: process.env.NODE_ENV,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    // allows cross-site cookies in production
    path: "/", // allow access to all routes
    maxAge: maxAge || 14 * 24 * 60 * 60 * 1000, // Default 14 days
  });
};

/**
 * Clear auth token cookie
 *
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

export {
  generateUserToken,
  generateTempToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
};
