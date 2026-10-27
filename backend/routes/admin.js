const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  deleteUser,
  deletePost,
  deleteComment
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Admin Routes
 *
 * Concepts for College / Viva Presentation:
 * 1. Router-Level Middleware:
 *    - By declaring `router.use(protect)` and `router.use(authorize('admin'))`,
 *      EVERY endpoint in this router file is strictly guarded against non-admin traffic.
 * 2. Principle of Least Privilege:
 *    - Administrative privileges (viewing user rosters, overall system metrics, deleting any user's content)
 *      are segregated into a dedicated endpoint space (`/api/admin`).
 */

// Apply protection and admin authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

// Platform metrics
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Content moderation
router.delete('/posts/:id', deletePost);
router.delete('/comments/:id', deleteComment);

module.exports = router;
