const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Admin Controller
 *
 * Concepts for College / Viva Presentation:
 * 1. Role-Based Administration:
 *    - Handlers here are protected by both `protect` and `authorize('admin')` middlewares.
 *    - Normal users receive HTTP 403 Forbidden when trying to access these endpoints.
 *
 * 2. Aggregations & Dashboard Statistics:
 *    - `getStats` runs concurrent database counts using `Promise.all` for high throughput,
 *      providing key performance indicators (KPIs) to the admin dashboard.
 *
 * 3. Administrative Cascade Cleanup & Guard Rails:
 *    - Admins are prevented from deleting their own active account, avoiding administrative lockout.
 *    - Deleting a user safely cascades across the database: removes the user's posts and comments
 *      to maintain data hygiene.
 */

// @desc    Get system-wide platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    // Execute all count queries in parallel for efficiency
    const [totalUsers, totalPublished, totalDrafts, totalComments] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Comment.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPublished,
        totalDrafts,
        totalComments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and cascade delete their posts & comments
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting their own currently logged in account
    if (userId === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User not found with id of ${userId}`
      });
    }

    // Find all post IDs authored by this user
    const userPosts = await Post.find({ author: userId }).select('_id');
    const postIds = userPosts.map((p) => p._id);

    // Cascade deletion:
    // 1. Delete comments authored by this user OR comments on any of this user's posts
    await Comment.deleteMany({
      $or: [{ author: userId }, { post: { $in: postIds } }]
    });

    // 2. Delete posts authored by this user
    await Post.deleteMany({ author: userId });

    // 3. Delete the user record
    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete any post and its comments
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${req.params.id}`
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete any comment
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: `Comment not found with id of ${req.params.id}`
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  deleteUser,
  deletePost,
  deleteComment
};
