/**
 * Rate Limiter Middleware
 * 
 * This middleware prevents abuse of the API by limiting the number of requests
 * from a single IP address within a specified time window.
 */

// Simple in-memory store for rate limiting
// In production, consider using Redis or another distributed store
const requestCounts = {};
const tempUserCreationCounts = {};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  
  // Clear entries older than the window period
  Object.keys(requestCounts).forEach(key => {
    if (requestCounts[key].resetTime < now) {
      delete requestCounts[key];
    }
  });
  
  Object.keys(tempUserCreationCounts).forEach(key => {
    if (tempUserCreationCounts[key].resetTime < now) {
      delete tempUserCreationCounts[key];
    }
  });
}, 60 * 60 * 1000); // 1 hour

/**
 * General rate limiter for all API requests
 * 
 * @param {Object} options - Rate limiting options
 * @param {Number} options.maxRequests - Maximum number of requests allowed in the window (default: 100)
 * @param {Number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 */
const rateLimiter = (options = {}) => {
  const maxRequests = options.maxRequests || 100;
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes by default
  
  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket.remoteAddress || 
               'unknown';
    
    const now = Date.now();
    
    // Initialize or update the count for this IP
    if (!requestCounts[ip]) {
      requestCounts[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else if (requestCounts[ip].resetTime < now) {
      // Reset count if the window has expired
      requestCounts[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      // Increment count
      requestCounts[ip].count++;
    }
    
    // Check if the count exceeds the limit
    if (requestCounts[ip].count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later.',
          retryAfter: Math.ceil((requestCounts[ip].resetTime - now) / 1000)
        }
      });
    }
    
    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCounts[ip].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestCounts[ip].resetTime / 1000));
    
    next();
  };
};

/**
 * Specific rate limiter for temporary user creation
 * More restrictive to prevent abuse
 * 
 * @param {Object} options - Rate limiting options
 * @param {Number} options.maxCreations - Maximum number of temp users allowed in the window (default: 10)
 * @param {Number} options.windowMs - Time window in milliseconds (default: 30 minutes)
 */
const tempUserCreationLimiter = (options = {}) => {
  const maxCreations = options.maxCreations || 10;
  const windowMs = options.windowMs || 30 * 60 * 1000; // 30 minutes by default
  
  return (req, res, next) => {
    // Get client IP
    const ip = req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket.remoteAddress || 
               'unknown';
    
    const now = Date.now();
    
    // Initialize or update the count for this IP
    if (!tempUserCreationCounts[ip]) {
      tempUserCreationCounts[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else if (tempUserCreationCounts[ip].resetTime < now) {
      // Reset count if the window has expired
      tempUserCreationCounts[ip] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      // Increment count
      tempUserCreationCounts[ip].count++;
    }
    
    // Check if the count exceeds the limit
    if (tempUserCreationCounts[ip].count > maxCreations) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many temporary user creations. Please try again later or register for a full account.',
          retryAfter: Math.ceil((tempUserCreationCounts[ip].resetTime - now) / 1000)
        }
      });
    }
    
    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxCreations);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxCreations - tempUserCreationCounts[ip].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(tempUserCreationCounts[ip].resetTime / 1000));
    
    next();
  };
};

export {
  rateLimiter,
  tempUserCreationLimiter
}; 