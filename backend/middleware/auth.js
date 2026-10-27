const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication & Role-Based Authorization Middleware
 *
 * Concepts for College / Viva Presentation:
 * 1. Bearer Token Authentication:
 *    - The client passes the token in the HTTP Authorization header as:
 *      "Authorization: Bearer <token>"
 *    - "Bearer" indicates that the presenter of the token is the bearer and owner of the access rights.
 *
 * 2. JWT Verification Flow:
 *    a. Extract token string after the "Bearer " prefix.
 *    b. Verify signature with jwt.verify(token, secret). If the token has been tampered with or expired,
 *       it throws an error.
 *    c. Decode the payload to extract the stored user ID.
 *    d. Fetch the corresponding user document from MongoDB.
 *    e. Attach user document to Express request object (req.user) so subsequent route handlers know
 *       who made the request without re-authenticating.
 *
 * 3. Role-Based Access Control (RBAC):
 *    - The authorize middleware limits route execution to specific roles (e.g. 'admin').
 *    - Returns 403 Forbidden if the authenticated user's role does not match permitted roles.
 */

/**
 * Protect routes: Authenticate incoming request via JWT
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in HTTP Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token string (split by space: "Bearer <token>")
    token = req.headers.authorization.split(' ')[1];
  }

  // Ensure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route: No token provided'
    });
  }

  try {
    // Verify token validity and signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Retrieve user by ID from the decoded payload and attach to req
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: User account no longer exists'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: Invalid or expired token'
    });
  }
};

/**
 * Grant access to specific roles (e.g. 'admin')
 * @param  {...string} roles - Permitted user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
