const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWriterDashboard,
  getGoals,
  upsertGoal,
  deleteGoal
} = require('../controllers/writerController');

/**
 * Writer Routes
 *
 * All routes are protected – requires a valid JWT.
 * Provides dashboard analytics and personal goal management.
 */

// GET /api/writer/dashboard – Full dashboard data
router.get('/dashboard', protect, getWriterDashboard);

// GET /api/writer/goals – Get user's goals
router.get('/goals', protect, getGoals);

// POST /api/writer/goals – Create or update a goal (upsert by type)
router.post('/goals', protect, upsertGoal);

// DELETE /api/writer/goals/:id – Delete a goal
router.delete('/goals/:id', protect, deleteGoal);

module.exports = router;
