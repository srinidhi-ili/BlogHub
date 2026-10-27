const express = require('express');
const router = express.Router();
const {
  getPosts,
  getMyPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

/**
 * Post Routes
 *
 * Concepts for College / Viva Presentation:
 * 1. Route Precedence:
 *    - Specific static routes like `/my-posts` MUST be declared BEFORE parameterized routes like `/:id`.
 *    - If `/:id` were declared first, an incoming request to `/my-posts` would match `/:id` with `req.params.id = 'my-posts'`,
 *      failing MongoDB's ObjectId validation with a CastError.
 *
 * 2. Route Protection:
 *    - Reading posts (public feed or specific post) is accessible publicly.
 *    - Creating, modifying, or deleting posts requires a valid JWT via `protect`.
 */

// Route: /api/posts
router.route('/')
  .get(getPosts)
  .post(protect, createPost);

// IMPORTANT: /my-posts must precede /:id to prevent route shadowing
router.get('/my-posts', protect, getMyPosts);

// Route: /api/posts/:id
router.route('/:id')
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;
