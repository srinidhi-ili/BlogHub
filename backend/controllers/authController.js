const User = require('../models/User');

/**
 * Authentication Controller
 *
 * Concepts for College / Viva Presentation:
 * 1. User Registration:
 *    - Validates presence of name, email, and password.
 *    - The password is automatically hashed by the User model pre-save hook before being stored.
 *    - Returns a signed JSON Web Token (JWT) so the user is immediately logged in upon registration.
 *
 * 2. User Login:
 *    - Queries the database for the user with email.
 *    - Password field has `select: false` in the schema for security; we explicitly include it using `.select('+password')`.
 *    - Compares entered plaintext password with the stored hash using bcrypt (`user.matchPassword`).
 *    - Issues a fresh signed JWT on successful match.
 *
 * 3. Protected /me Endpoint:
 *    - Reads the decoded user object attached to `req.user` by the `protect` middleware.
 *    - Allows the frontend client (e.g. React) to restore session state upon page reload.
 */

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate that all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create user in database (pre-save hook hashes password)
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate signed JWT token
    const token = user.getSignedJwtToken();

    // Respond with created user data and token
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password'
      });
    }

    // Find user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if entered plaintext password matches the bcrypt hash
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate signed JWT token
    const token = user.getSignedJwtToken();

    // Respond with authenticated user data and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private (Requires JWT token)
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware after verifying JWT
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
