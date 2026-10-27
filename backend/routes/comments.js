const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

/**
 * Comment Routes
 *
 * Concepts for College / Viva Presentation:
 * - Nested resource endpoints:
 *   * GET /api/posts/:id/comments (Public: view comments of a post)
 *   * POST /api/posts/:id/comments (Protected: submit comment to a post)
 * - Independent resource endpoint:
 *   * DELETE /api/comments/:id (Protected: author or admin deletes comment)
 */

// Nested routes under posts
router.route('/posts/:id/comments')
  .get(getComments)
  .post(protect, createComment);

// Direct comment route
router.route('/comments/:id')
  .delete(protect, deleteComment);

module.exports = router;
