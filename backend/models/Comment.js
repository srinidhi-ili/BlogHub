const mongoose = require('mongoose');

/**
 * Comment Model Schema
 *
 * Concepts for College / Viva Presentation:
 * 1. Relational Modeling in NoSQL:
 *    - In relational databases, comments would typically have foreign keys (author_id, post_id).
 *    - In MongoDB/Mongoose, we reference documents using ObjectId:
 *      * `author`: references the User document who wrote the comment.
 *      * `post`: references the Post document to which this comment belongs.
 * 2. Referencing vs Embedding:
 *    - Why reference comments instead of embedding them inside the Post document?
 *      * Embedding can cause unbounded document growth if a post receives thousands of comments,
 *        risking MongoDB's 16MB document size limit.
 *      * Referencing allows scalable pagination, sorting, and independent moderation of comments.
 */
const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide comment text'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author']
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment must belong to a post']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', CommentSchema);
