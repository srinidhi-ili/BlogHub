const Post = require('../models/Post');
const Comment = require('../models/Comment');

/**
 * Post Controller
 *
 * Concepts for College / Viva Presentation:
 * 1. Filtering, Searching, Sorting & Pagination:
 *    - Search is implemented using MongoDB `$regex` operator with the `'i'` (case-insensitive) flag across
 *      multiple fields using `$or`.
 *    - Pagination calculates `skip = (page - 1) * limit` to selectively retrieve slices of documents,
 *      minimizing memory usage and network transfer for large collections.
 *    - Total count is obtained via `Post.countDocuments(query)` to calculate total pages for frontend pagination.
 *
 * 2. Authorization / Ownership Verification:
 *    - Users can only update or delete their own posts, unless they possess the `'admin'` role.
 *    - Comparing MongoDB ObjectIds requires `.toString()` comparison: `post.author.toString() === req.user.id`.
 *
 * 3. Cascading Deletion:
 *    - When a post is deleted, its child comments are also cleaned up using `Comment.deleteMany({ post: id })`
 *      to maintain referential integrity in NoSQL.
 */

// @desc    Get all published posts with search, category filtering, sort, and pagination
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Public feeds only show published posts
    const query = { status: 'published' };

    // Search keyword across title and content
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    // Category filter
    if (category && category.trim() !== '') {
      query.category = category.trim();
    }

    // Sorting: default newest first, or 'oldest' first
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // Count total matching documents for pagination metadata
    const total = await Post.countDocuments(query);

    // Query posts with population, sort, and pagination
    const posts = await Post.find(query)
      .populate('author', 'name email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's posts (both drafts and published)
// @route   GET /api/posts/my-posts
// @access  Private
const getMyPosts = async (req, res, next) => {
  try {
    const query = { author: req.user.id };

    // Optional status filter (draft or published)
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Sort by recent updates first
    const posts = await Post.find(query)
      .populate('author', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { title, summary, content, category, status } = req.body;

    const postData = {
      title,
      summary,
      content,
      category,
      status: status || 'draft',
      author: req.user.id
    };

    // If status is published upon creation, record published timestamp
    if (postData.status === 'published') {
      postData.publishedAt = Date.now();
    }

    const post = await Post.create(postData);

    // Populate author details before returning
    await post.populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${req.params.id}`
      });
    }

    // Verify post ownership or admin privilege
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    const updateFields = { ...req.body };

    // If post transitions from draft to published, record publishedAt
    if (updateFields.status === 'published' && post.status !== 'published') {
      updateFields.publishedAt = Date.now();
    }

    post = await Post.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    }).populate('author', 'name email');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post and its associated comments
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: `Post not found with id of ${req.params.id}`
      });
    }

    // Verify post ownership or admin privilege
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Cascade delete: remove all comments referencing this post
    await Comment.deleteMany({ post: post._id });

    // Delete post document
    await post.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPost,
  getMyPosts,
  createPost,
  updatePost,
  deletePost
};
