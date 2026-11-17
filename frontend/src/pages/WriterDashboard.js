import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import {
  FaPlus,
  FaEdit,
  FaEye,
  FaFire,
  FaChartBar,
  FaFileAlt,
  FaCheckCircle,
  FaRegClock,
  FaArrowUp,
  FaArrowDown,
  FaBullseye,
  FaTachometerAlt,
  FaPenNib,
  FaListUl,
  FaRocket,
  FaTimes,
} from 'react-icons/fa';
import '../styles/Dashboard.css';

/**
 * ============================================================================
 * Writer Productivity Dashboard
 * ============================================================================
 * Professional dashboard showing real-time statistics, writing activity,
 * goal progress, draft reminders, and recent articles.
 *
 * All data comes from GET /api/writer/dashboard (backend).
 * Goals are managed via POST /api/writer/goals and DELETE /api/writer/goals/:id.
 * ============================================================================
 */
const WriterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ type: 'daily', targetCount: 1, month: '' });
  const [goalSaving, setGoalSaving] = useState(false);

  // Active sidebar tab
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/writer/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Goal handlers ─────────────────────────────────────────────────────────
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setGoalSaving(true);
    try {
      await api.post('/writer/goals', goalForm);
      setShowGoalModal(false);
      fetchDashboard(); // refresh stats
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save goal');
    } finally {
      setGoalSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Remove this goal?')) return;
    try {
      await api.delete(`/writer/goals/${goalId}`);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete goal');
    }
  };

  // ── Sidebar navigation items ──────────────────────────────────────────────
  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: <FaTachometerAlt /> },
    { key: 'activity', label: 'Writing Activity', icon: <FaChartBar /> },
    { key: 'goals', label: 'Goals & Progress', icon: <FaBullseye /> },
    { key: 'drafts', label: 'Draft Attention', icon: <FaPenNib /> },
    { key: 'recent', label: 'Recent Articles', icon: <FaListUl /> },
    { key: 'actions', label: 'Quick Actions', icon: <FaRocket /> },
  ];

  // ── Loading & Error states ────────────────────────────────────────────────
  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  if (error && !data) {
    return (
      <div className="dashboard-error-container">
        <Alert type="error" message={error} onClose={() => setError(null)} />
        <button className="btn btn-primary" onClick={() => { setLoading(true); fetchDashboard(); }}>
          Retry
        </button>
      </div>
    );
  }

  const {
    stats,
    todayCount,
    thisWeekCount,
    weeklyActivity,
    weekComparison,
    streak,
    draftAttention,
    recentArticles,
    goals,
  } = data;

  const displayName = user?.name || user?.username || 'Writer';

  // ── Helper: simple bar chart using pure CSS/HTML ──────────────────────────
  const maxActivity = Math.max(...weeklyActivity.map((d) => d.count), 1);

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <FaTachometerAlt className="sidebar-logo-icon" />
          <span className="sidebar-title">Dashboard</span>
        </div>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="dashboard-main">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* ── Welcome Section ──────────────────────────────────────────── */}
        <section className="dashboard-welcome">
          <div className="welcome-text">
            <h1>Welcome back, {displayName}!</h1>
            <p className="welcome-subtitle">Here's your writing productivity overview</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/create-post')}>
            <FaPlus /> Create New Post
          </button>
        </section>

        {/* ── Stats Cards (always visible) ─────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'activity') && (
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <FaFileAlt />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Articles</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <FaCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.published}</span>
                <span className="stat-label">Published</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <FaEdit />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.drafts}</span>
                <span className="stat-label">Drafts</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper purple">
                <FaRegClock />
              </div>
              <div className="stat-info">
                <span className="stat-number">{stats.updatedThisWeek}</span>
                <span className="stat-label">Updated This Week</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Writing Streak & Week Comparison ─────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'activity') && (
          <section className="streak-comparison-row">
            <div className="streak-card">
              <FaFire className="streak-fire" />
              <div>
                <span className="streak-number">{streak}</span>
                <span className="streak-label">Day Streak</span>
              </div>
            </div>
            <div className="comparison-card">
              <div className="comparison-header">vs Previous Week</div>
              <div className="comparison-body">
                <span className={`comparison-badge ${weekComparison.change >= 0 ? 'up' : 'down'}`}>
                  {weekComparison.change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {Math.abs(weekComparison.change)}%
                </span>
                <span className="comparison-detail">
                  {weekComparison.current} this week vs {weekComparison.previous} last week
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Weekly Activity Chart ────────────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'activity') && (
          <section className="activity-chart-section card">
            <h2 className="section-title"><FaChartBar /> Weekly Writing Activity</h2>
            <div className="bar-chart">
              {weeklyActivity.map((d) => (
                <div key={d.date} className="bar-column">
                  <span className="bar-value">{d.count}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${(d.count / maxActivity) * 100}%` }}
                    />
                  </div>
                  <span className="bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Goals & Progress ─────────────────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'goals') && (
          <section className="goals-section card">
            <div className="section-title-row">
              <h2 className="section-title"><FaBullseye /> Goals & Progress</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowGoalModal(true)}>
                <FaPlus /> Set Goal
              </button>
            </div>

            {(!goals || (Object.keys(goals).length === 0)) ? (
              <div className="empty-state">
                <FaBullseye className="empty-icon" />
                <p>No goals set yet. Set a daily, weekly, or monthly writing target to track your progress!</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowGoalModal(true)}>
                  <FaPlus /> Set Your First Goal
                </button>
              </div>
            ) : (
              <div className="goals-grid">
                {goals.daily && (
                  <div className="goal-card">
                    <div className="goal-header">
                      <span className="goal-type-badge daily">Daily Goal</span>
                      <button className="goal-delete-btn" onClick={() => handleDeleteGoal(goals.daily._id)} title="Remove goal">
                        <FaTimes />
                      </button>
                    </div>
                    <div className="goal-progress-ring">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                          className="circle-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="circle-fill daily"
                          strokeDasharray={`${goals.daily.progress}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{goals.daily.progress}%</text>
                      </svg>
                    </div>
                    <p className="goal-detail">{goals.daily.current} / {goals.daily.targetCount} articles today</p>
                  </div>
                )}
                {goals.weekly && (
                  <div className="goal-card">
                    <div className="goal-header">
                      <span className="goal-type-badge weekly">Weekly Goal</span>
                      <button className="goal-delete-btn" onClick={() => handleDeleteGoal(goals.weekly._id)} title="Remove goal">
                        <FaTimes />
                      </button>
                    </div>
                    <div className="goal-progress-ring">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                          className="circle-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="circle-fill weekly"
                          strokeDasharray={`${goals.weekly.progress}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{goals.weekly.progress}%</text>
                      </svg>
                    </div>
                    <p className="goal-detail">{goals.weekly.current} / {goals.weekly.targetCount} articles this week</p>
                  </div>
                )}
                {goals.monthly && (
                  <div className="goal-card">
                    <div className="goal-header">
                      <span className="goal-type-badge monthly">Monthly Goal</span>
                      <button className="goal-delete-btn" onClick={() => handleDeleteGoal(goals.monthly._id)} title="Remove goal">
                        <FaTimes />
                      </button>
                    </div>
                    <div className="goal-progress-ring">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path
                          className="circle-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="circle-fill monthly"
                          strokeDasharray={`${goals.monthly.progress}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{goals.monthly.progress}%</text>
                      </svg>
                    </div>
                    <p className="goal-detail">{goals.monthly.current} / {goals.monthly.targetCount} articles this month</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Draft Attention Centre ───────────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'drafts') && (
          <section className="draft-attention-section card">
            <h2 className="section-title"><FaPenNib /> Drafts Needing Attention</h2>
            {draftAttention.length === 0 ? (
              <div className="empty-state">
                <FaCheckCircle className="empty-icon success" />
                <p>All your drafts are up‑to‑date! Great work.</p>
              </div>
            ) : (
              <ul className="draft-list">
                {draftAttention.map((d) => (
                  <li key={d._id} className="draft-item">
                    <div className="draft-info">
                      <span className="draft-title">{d.title}</span>
                      <span className="draft-date">
                        Last updated: {new Date(d.updatedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/edit-post/${d._id}`)}
                    >
                      <FaEdit /> Continue Editing
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Recent Articles ──────────────────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'recent') && (
          <section className="recent-articles-section card">
            <h2 className="section-title"><FaListUl /> Recent Articles</h2>
            {recentArticles.length === 0 ? (
              <div className="empty-state">
                <FaFileAlt className="empty-icon" />
                <p>You haven't written any articles yet. Start your first story!</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/create-post')}>
                  <FaPlus /> Write Your First Article
                </button>
              </div>
            ) : (
              <div className="recent-table-wrapper">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentArticles.map((article) => (
                      <tr key={article._id}>
                        <td className="article-title-cell">{article.title}</td>
                        <td><span className="category-pill">{article.category}</span></td>
                        <td>
                          <span className={`status-badge ${article.status}`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(article.updatedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </td>
                        <td className="actions-cell">
                          <Link to={`/post/${article._id}`} className="btn btn-outline btn-sm" title="View">
                            <FaEye />
                          </Link>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/edit-post/${article._id}`)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        {(activeSection === 'overview' || activeSection === 'actions') && (
          <section className="quick-actions-section card">
            <h2 className="section-title"><FaRocket /> Quick Actions</h2>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/create-post')}>
                <FaPlus className="qa-icon" />
                <span>New Article</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/my-blogs')}>
                <FaListUl className="qa-icon" />
                <span>My Articles</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/explore')}>
                <FaEye className="qa-icon" />
                <span>Explore Posts</span>
              </button>
              <button className="quick-action-btn" onClick={() => setShowGoalModal(true)}>
                <FaBullseye className="qa-icon" />
                <span>Set a Goal</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ── Goal Modal ───────────────────────────────────────────────────── */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Set Writing Goal</h3>
            <form onSubmit={handleSaveGoal}>
              <div className="form-group">
                <label className="form-label">Goal Type</label>
                <select
                  className="form-control"
                  value={goalForm.type}
                  onChange={(e) => setGoalForm((prev) => ({ ...prev, type: e.target.value, ...(e.target.value !== 'monthly' && { month: '' }) }))}
                >
                  <option value="daily">Daily (articles per day)</option>
                  <option value="weekly">Weekly (articles per week)</option>
                  <option value="monthly">Monthly (articles per month)</option>
                </select>
                {goalForm.type === 'monthly' && (
                  <div className="form-group">
                    <label className="form-label">Month (1‑12)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="12"
                      value={goalForm.month}
                      onChange={(e) => setGoalForm((prev) => ({ ...prev, month: parseInt(e.target.value, 10) }))}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Target Number of Articles</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="50"
                  value={goalForm.targetCount}
                  onChange={(e) => setGoalForm((prev) => ({ ...prev, targetCount: parseInt(e.target.value, 10) || 1 }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={goalSaving}>
                  {goalSaving ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriterDashboard;
