const mongoose = require('mongoose');

/**
 * Post Model Schema
 *
 * Concepts for College / Viva Presentation:
 * 1. Relationships & Population in MongoDB:
 *    - MongoDB is a document-oriented NoSQL database without native SQL JOINs.
 *    - Mongoose provides document referencing via `mongoose.Schema.Types.ObjectId` and the `ref` option.
 *    - `author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }` stores only the 24-character hex ID
 *      of the user document.
 *    - During query execution, `.populate('author', 'name email')` dynamically substitutes the ID with the
 *      actual user document, behaving similarly to a SQL JOIN.
 *
 * 2. Categorization & Enums:
 *    - The `enum` validator restricts permissible values to a predefined list, enforcing domain rules
 *      directly at the database abstraction layer.
 *
 * 3. Lifecycle Hooks for Timestamps & Publishing:
 *    - The pre-save hook updates `updatedAt` whenever modifications occur.
 *    - When a draft post transitions to 'published', `publishedAt` is automatically populated.
 */
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a post title'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  summary: {
    type: String,
    required: [true, 'Please provide a short summary'],
    trim: true,
    maxlength: [300, 'Summary cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide content for the blog post']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: {
      values: [
        'Technology',
        'Lifestyle',
        'Education',
        'Health',
        'Travel',
        'Food',
        'Sports',
        'Entertainment',
        'Science',
        'Other'
      ],
      message: '{VALUE} is not a supported category'
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Every post must have an author']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Status must be either draft or published'
    },
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
});

/**
 * Pre-save hook: Update timestamps and track publishing date
 */
PostSchema.pre('save', function (next) {
  // Always update updatedAt on document save
  this.updatedAt = Date.now();

  // If status is transitioning to 'published' and publishedAt is unset, record timestamp
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }

  next();
});

module.exports = mongoose.model('Post', PostSchema);
