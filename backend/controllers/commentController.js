const Comment = require('../models/Comment');
const Post = require('../models/Post');

/**
 * Comment Controller
 *
 * Concepts for College / Viva Presentation:
 * 1. Nested Resource Pattern:
 *    - Comments belong to posts. The URL `/api/posts/:id/comments` represents a sub-resource relationship.
 *    - To retrieve comments for a specific post, we query the `Comment` collection where the `post` field equals `:id`.
 *
 * 2. Referential Validation:
 *    - Before creating a comment, the controller verifies that the parent post actually exists.
 *    - Prevents orphaned comments pointing to nonexistent blog posts.
 *
 * 3. Populating Nested Documents:
 *    - After creating a comment, `.populate('author', 'name')` immediately attaches the author's public
 *      profile (name) so the frontend can display the author immediately without an additional network request.
 */

// @desc    Get all comments for a specific post
// @route   GET /api/posts/:id/comments
// @access  Public
const getComments = async (req, res, next) => {
  try {
    const postId = req.params.id;

    // Verify post exists before fetching comments
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${postId}`
      });
    }

    // Retrieve comments for this post, ordered newest first
    const comments = await Comment.find({ post: postId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const createComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;

    // Validate comment body
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide comment content'
      });
    }

    // Verify parent post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${postId}`
      });
    }

    // Create the comment document
    const comment = await Comment.create({
      content: content.trim(),
      post: postId,
      author: req.user.id
    });

    // Populate author name before returning response
    await comment.populate('author', 'name');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Owner or Admin)
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: `Comment not found with id of ${req.params.id}`
      });
    }

    // Ensure user is comment author or an admin
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment'
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
  getComments,
  createComment,
  deleteComment
};
