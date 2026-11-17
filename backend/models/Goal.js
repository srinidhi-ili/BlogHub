const mongoose = require('mongoose');

/**
 * Goal Model Schema
 *
 * Stores per-user daily, weekly, and monthly writing targets.
 * Each user can have one goal per type (daily, weekly, monthly).
 *
 * Concepts for College / Viva Presentation:
 * - We use a compound index on (user + type) to enforce at most one goal per type per user.
 */
const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Goal must belong to a user']
  },
  type: {
    type: String,
    enum: {
      values: ['daily', 'weekly', 'monthly'],
      message: 'Goal type must be daily, weekly, or monthly'
    },
    required: [true, 'Please specify goal type (daily, weekly, or monthly)']
  },
  targetCount: {
    type: Number,
    required: [true, 'Please set a target number of articles'],
    min: [1, 'Target must be at least 1']
  },
  month: {
    type: Number,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index: one daily goal + one weekly goal per user
GoalSchema.index({ user: 1, type: 1 }, { unique: true });

// Update the updatedAt timestamp before saving
GoalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Goal', GoalSchema);
