const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * Auth Routes
 *
 * Concepts for College / Viva Presentation:
 * - Express Router encapsulates endpoints related to the authentication domain.
 * - Public endpoints (/register, /login) do not require authorization headers.
 * - Private endpoints (/me) apply the `protect` middleware before reaching the controller.
 */

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
