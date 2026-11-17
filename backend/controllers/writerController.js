const Post = require('../models/Post');
const Goal = require('../models/Goal');

/**
 * Writer Controller
 *
 * Provides dashboard analytics and goal management for authenticated writers.
 *
 * Concepts for College / Viva Presentation:
 * 1. MongoDB Aggregation Pipeline:
 *    - $match filters documents, $project reshapes them, $group accumulates.
 *    - Used here to build a "posts per day" activity chart from real data.
 * 2. Date Arithmetic:
 *    - JavaScript Date objects support subtraction to compute differences in ms.
 *    - We calculate "7 days ago" and "start of today" to partition activity windows.
 * 3. Writing Streak:
 *    - Iterates backwards from yesterday; each consecutive day with ≥1 post adds 1 to the streak.
 */

// Helper: get the start of a given date (midnight)
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── GET /api/writer/dashboard ──────────────────────────────────────────────
const getWriterDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const sevenDaysAgo = new Date(todayStart - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(todayStart - 14 * 24 * 60 * 60 * 1000);

    // ── 1. Basic stats ──────────────────────────────────────────────────────
    const [total, published, drafts] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Post.countDocuments({ author: userId, status: 'published' }),
      Post.countDocuments({ author: userId, status: 'draft' })
    ]);

    const updatedThisWeek = await Post.countDocuments({
      author: userId,
      updatedAt: { $gte: sevenDaysAgo }
    });

    // ── 2. Today's count (for daily goal progress) ──────────────────────────
    const todayCount = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: todayStart }
    });

    // ── 3. This week's count (for weekly goal progress) ─────────────────────
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start
    const thisWeekCount = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: weekStart }
    });

    // ── 4. Weekly writing activity (last 7 days, posts per day) ─────────────
    const activityPipeline = [
      {
        $match: {
          author: req.user._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        }
      },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ];
    const activityRaw = await Post.aggregate(activityPipeline);

    // Fill missing days with 0
    const activityMap = {};
    activityRaw.forEach((item) => { activityMap[item._id] = item.count; });
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart - i * 24 * 60 * 60 * 1000);
      const key = day.toISOString().slice(0, 10);
      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyActivity.push({ date: key, day: dayName, count: activityMap[key] || 0 });
    }

    // ── 5. Previous week activity (for comparison) ──────────────────────────
    const prevWeekPipeline = [
      {
        $match: {
          author: req.user._id,
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
        }
      },
      { $count: 'total' }
    ];
    const prevWeekResult = await Post.aggregate(prevWeekPipeline);
    const previousWeekTotal = prevWeekResult.length > 0 ? prevWeekResult[0].total : 0;
    const currentWeekTotal = activityRaw.reduce((sum, d) => sum + d.count, 0);

    // ── 6. Writing streak (consecutive days with ≥1 post, up to 365) ────────
    let streak = 0;
    // Check if there's a post today first
    if (todayCount > 0) streak = 1;
    // Then walk backwards from yesterday
    for (let i = 1; i <= 365; i++) {
      const dayStart = new Date(todayStart - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = await Post.countDocuments({
        author: userId,
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      if (count > 0) {
        streak++;
      } else {
        // If today had 0 posts but yesterday did, start from yesterday
        if (i === 1 && todayCount === 0) {
          // Check if yesterday had posts
          if (count === 0) break;
        }
        break;
      }
    }

    // ── 7. Draft attention centre (drafts not updated for ≥7 days) ──────────
    const staleDrafts = await Post.find({
      author: userId,
      status: 'draft',
      updatedAt: { $lt: sevenDaysAgo }
    })
      .select('title updatedAt')
      .sort({ updatedAt: 1 })
      .limit(10);

    // ── 8. Recent articles (latest 5) ───────────────────────────────────────
    const recentArticles = await Post.find({ author: userId })
      .select('title category status updatedAt createdAt publishedAt')
      .sort({ updatedAt: -1 })
      .limit(5);

    // ── 9. Goals ────────────────────────────────────────────────────────────
    // Monthly count: posts created in the current calendar month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: monthStart }
    });

    const goals = await Goal.find({ user: userId });
    const goalsData = {};
    goals.forEach((g) => {
      let current;
      if (g.type === 'daily') current = todayCount;
      else if (g.type === 'weekly') current = thisWeekCount;
      else current = thisMonthCount; // monthly

      goalsData[g.type] = {
        _id: g._id,
        targetCount: g.targetCount,
        month: g.month || null,
        current,
        progress: Math.min(
          100,
          Math.round((current / g.targetCount) * 100)
        )
      };
    });

    // ── 10. Respond ─────────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      data: {
        stats: { total, published, drafts, updatedThisWeek },
        todayCount,
        thisWeekCount,
        weeklyActivity,
        weekComparison: {
          current: currentWeekTotal,
          previous: previousWeekTotal,
          change: previousWeekTotal > 0
            ? Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100)
            : currentWeekTotal > 0 ? 100 : 0
        },
        streak,
        draftAttention: staleDrafts,
        recentArticles,
        goals: goalsData
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Goal CRUD ──────────────────────────────────────────────────────────────

// @desc   Get current user's goals
// @route  GET /api/writer/goals
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user.id });
    res.status(200).json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
};

// @desc   Create or update a goal (upsert by type)
// @route  POST /api/writer/goals
const upsertGoal = async (req, res, next) => {
  try {
    const { type, targetCount, month } = req.body;

    if (!type || !targetCount) {
      return res.status(400).json({
        success: false,
        error: 'Please provide goal type (daily/weekly/monthly) and targetCount'
      });
    }

    // Validate month only for monthly goals
    if (type === 'monthly') {
      if (!month || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          error: 'Monthly goal requires a valid month (1-12).'
        });
      }
    }

    // Build update object, conditionally adding month
    const update = { targetCount, updatedAt: Date.now() };
    if (type === 'monthly') update.month = month;

    // Upsert: update if exists, create if not
    const goal = await Goal.findOneAndUpdate(
      { user: req.user.id, type },
      { $set: update, $setOnInsert: { user: req.user.id, type } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a goal
// @route  DELETE /api/writer/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }

    // Ownership check
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await goal.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWriterDashboard, getGoals, upsertGoal, deleteGoal };
