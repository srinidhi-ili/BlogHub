import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import {
  FaUsers,
  FaFileAlt,
  FaEdit,
  FaComments,
  FaTrashAlt,
  FaShieldAlt,
} from 'react-icons/fa';
import '../styles/AdminDashboard.css';

/**
 * ============================================================================
 * AdminDashboard Page Component
 * ============================================================================
 * Exclusive management suite for platform administrators.
 *
 * Capabilities:
 * 1. Global Metrics: Queries GET /admin/stats for total user registrations,
 *    live articles, drafts, and community comments.
 * 2. User Administration: Lists registered members (GET /admin/users) and
 *    provides account deletion (DELETE /admin/users/:id).
 * 3. Article Moderation: Lists all platform publications (GET /posts) and provides
 *    administrative takedown (DELETE /admin/posts/:id or DELETE /posts/:id).
 * 4. Discussion Moderation: Reviews community feedback and removes abusive comments
 *    (DELETE /admin/comments/:id or DELETE /comments/:id).
 * 5. Safety Guards: Mandatory modal confirmation dialog before executing deletions.
 * ============================================================================
 */
const AdminDashboard = () => {
  // Navigation tabs: 'users' | 'posts' | 'comments'
  const [activeTab, setActiveTab] = useState('users');

  // Dashboard dataset states
  const [stats, setStats] = useState({
    totalUsers: 0,
    publishedPosts: 0,
    drafts: 0,
    totalComments: 0,
  });
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);

  // UI status
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'user' | 'post' | 'comment'
    item: null,
  });

  /**
   * Fetch system metrics and lists
   */
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      try {
        const statsRes = await api.get('/admin/stats');
        const sData = statsRes.data.stats || statsRes.data.data || statsRes.data;
        if (sData) {
          setStats({
            totalUsers: sData.totalUsers ?? sData.users ?? 0,
            publishedPosts: sData.publishedPosts ?? sData.posts ?? 0,
            drafts: sData.drafts ?? sData.totalDrafts ?? 0,
            totalComments: sData.totalComments ?? sData.comments ?? 0,
          });
        }
      } catch (err) {
        console.warn('Admin stats endpoint note:', err.message);
      }

      // 2. Fetch Users
      try {
        const usersRes = await api.get('/admin/users');
        const uList = usersRes.data.users || usersRes.data.data || usersRes.data;
        setUsers(Array.isArray(uList) ? uList : []);
      } catch (err) {
        console.warn('Admin users endpoint note:', err.message);
      }

      // 3. Fetch Posts (all)
      try {
        const postsRes = await api.get('/posts', { params: { limit: 100 } });
        const pList = postsRes.data.posts || postsRes.data.data || postsRes.data;
        setPosts(Array.isArray(pList) ? pList : []);
      } catch (err) {
        console.warn('Posts fetch note:', err.message);
      }

      // 4. Fetch Comments
      try {
        const commentsRes = await api.get('/admin/comments');
        const cList =
          commentsRes.data.comments || commentsRes.data.data || commentsRes.data;
        setComments(Array.isArray(cList) ? cList : []);
      } catch (err) {
        console.warn('Admin comments endpoint note:', err.message);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setAlert({ type: 'error', message: 'Could not load administrative data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Open deletion modal
  const promptDelete = (type, item) => {
    setDeleteModal({
      isOpen: true,
      type,
      item,
    });
  };

  // Close deletion modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: null, item: null });
  };

  // Execute deletion
  const executeDelete = async () => {
    const { type, item } = deleteModal;
    if (!item) return;
    const itemId = item._id || item.id;

    try {
      if (type === 'user') {
        await api.delete(`/admin/users/${itemId}`);
        setUsers((prev) => prev.filter((u) => (u._id || u.id) !== itemId));
        setStats((prev) => ({ ...prev, totalUsers: Math.max(prev.totalUsers - 1, 0) }));
        setAlert({ type: 'success', message: 'User account removed.' });
      } else if (type === 'post') {
        try {
          await api.delete(`/admin/posts/${itemId}`);
        } catch (e) {
          await api.delete(`/posts/${itemId}`);
        }
        setPosts((prev) => prev.filter((p) => (p._id || p.id) !== itemId));
        setStats((prev) => ({
          ...prev,
          publishedPosts: item.status === 'published' ? Math.max(prev.publishedPosts - 1, 0) : prev.publishedPosts,
          drafts: item.status === 'draft' ? Math.max(prev.drafts - 1, 0) : prev.drafts,
        }));
        setAlert({ type: 'success', message: 'Article deleted by administrator.' });
      } else if (type === 'comment') {
        try {
          await api.delete(`/admin/comments/${itemId}`);
        } catch (e) {
          await api.delete(`/comments/${itemId}`);
        }
        setComments((prev) => prev.filter((c) => (c._id || c.id) !== itemId));
        setStats((prev) => ({ ...prev, totalComments: Math.max(prev.totalComments - 1, 0) }));
        setAlert({ type: 'success', message: 'Comment deleted.' });
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || `Failed to delete ${type}.`,
      });
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-dashboard-container">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-title-row">
          <FaShieldAlt className="admin-badge-icon" />
          <h1 className="admin-title">Administrator Console</h1>
        </div>
        <p className="admin-subtitle">
          Global moderation, system metrics, and member management.
        </p>
      </div>

      {/* Stats Cards (Row of 4) */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <FaUsers />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">{stats.totalUsers || users.length}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <FaFileAlt />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">
              {stats.publishedPosts ||
                posts.filter((p) => p.status === 'published').length}
            </span>
            <span className="stat-label">Published Posts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <FaEdit />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">
              {stats.drafts || posts.filter((p) => p.status === 'draft').length}
            </span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <FaComments />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">
              {stats.totalComments || comments.length}
            </span>
            <span className="stat-label">Comments</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({posts.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({comments.length})
        </button>
      </div>

      {/* Main Tab Panel */}
      {loading ? (
        <LoadingSpinner message="Aggregating platform data..." />
      ) : (
        <div className="admin-tab-content">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th className="actions-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-cell">
                        No user records found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const uId = u._id || u.id;
                      const joined = u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent';

                      return (
                        <tr key={uId}>
                          <td className="font-semibold">
                            {u.name || u.username || 'User'}
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span
                              className={`role-badge ${
                                u.role === 'admin'
                                  ? 'role-admin'
                                  : 'role-user'
                              }`}
                            >
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="table-date-cell">{joined}</td>
                          <td className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-delete-sm"
                              onClick={() => promptDelete('user', u)}
                              title="Delete user"
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: POSTS */}
          {activeTab === 'posts' && (
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="actions-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty-cell">
                        No articles published yet.
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => {
                      const pId = p._id || p.id;
                      const authorName =
                        typeof p.author === 'string'
                          ? p.author
                          : p.author?.name ||
                            p.author?.username ||
                            'Writer';
                      const pDate = p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A';

                      return (
                        <tr key={pId}>
                          <td className="post-title-cell font-semibold">
                            {p.title}
                          </td>
                          <td>{authorName}</td>
                          <td>
                            <span className="table-category-tag">
                              {p.category || 'General'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${
                                p.status === 'published'
                                  ? 'badge-published'
                                  : 'badge-draft'
                              }`}
                            >
                              {p.status || 'draft'}
                            </span>
                          </td>
                          <td className="table-date-cell">{pDate}</td>
                          <td className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-delete-sm"
                              onClick={() => promptDelete('post', p)}
                              title="Delete post"
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="table-responsive-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Comment Excerpt</th>
                    <th>Author</th>
                    <th>Post / Context</th>
                    <th>Date</th>
                    <th className="actions-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="table-empty-cell">
                        No comments found.
                      </td>
                    </tr>
                  ) : (
                    comments.map((c) => {
                      const cId = c._id || c.id;
                      const authorName =
                        typeof c.author === 'string'
                          ? c.author
                          : c.author?.name ||
                            c.author?.username ||
                            'Reader';
                      const postTitle =
                        c.post?.title || c.postTitle || 'Blog Article';
                      const cDate = c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent';

                      return (
                        <tr key={cId}>
                          <td className="comment-excerpt-cell">
                            "{c.content?.substring(0, 70)}
                            {c.content?.length > 70 ? '...' : ''}"
                          </td>
                          <td className="font-semibold">{authorName}</td>
                          <td>{postTitle}</td>
                          <td className="table-date-cell">{cDate}</td>
                          <td className="table-actions-cell">
                            <button
                              type="button"
                              className="btn-delete-sm"
                              onClick={() => promptDelete('comment', c)}
                              title="Delete comment"
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-container" role="dialog" aria-modal="true">
            <h3 className="modal-title">Confirm Administrative Action</h3>
            <p className="modal-body">
              Are you sure you want to permanently remove this {deleteModal.type}?
              This action cannot be reverted.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={executeDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
