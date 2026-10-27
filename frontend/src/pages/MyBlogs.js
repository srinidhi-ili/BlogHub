import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import {
  FaPlus,
  FaFileAlt,
  FaCheckCircle,
  FaEdit,
  FaTrashAlt,
  FaGlobe,
  FaLock,
} from 'react-icons/fa';
import '../styles/MyBlogs.css';

/**
 * ============================================================================
 * MyBlogs Page Component (Author Management Dashboard)
 * ============================================================================
 * Central hub for authors to track metrics and administer their publications.
 *
 * Core Capabilities:
 * 1. Metrics Overview: Calculates real-time statistics for total stories,
 *    published articles, and in-progress drafts.
 * 2. Status Filtering: Segment posts by tabs (All, Published, Drafts).
 * 3. Quick Actions:
 *    - Edit story: Routes to `/edit-post/:id`.
 *    - Toggle status: Instantly toggles between Draft <-> Published.
 *    - Delete story: Modal-confirmed deletion via DELETE /posts/:id.
 * ============================================================================
 */
const MyBlogs = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'published' | 'draft'
  const [alert, setAlert] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /**
   * Fetch author's posts
   */
  const fetchMyPosts = useCallback(async () => {
    setLoading(true);
    try {
      // First attempt standard author endpoint GET /posts/my-posts
      let response;
      try {
        response = await api.get('/posts/my-posts');
      } catch (e) {
        // Fallback for backends that use query params instead
        const currentUserId = user?._id || user?.id;
        response = await api.get('/posts', {
          params: { author: currentUserId },
        });
      }

      const list =
        response.data.posts || response.data.data || response.data;
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load user blogs:', err);
      setAlert({
        type: 'error',
        message: 'Could not fetch your articles. Please refresh.',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  /**
   * Toggle Publish <-> Draft
   */
  const handleToggleStatus = async (post) => {
    const postId = post._id || post.id;
    const newStatus = post.status === 'published' ? 'draft' : 'published';

    setActionLoadingId(postId);
    try {
      await api.put(`/posts/${postId}`, {
        status: newStatus,
      });

      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === postId ? { ...p, status: newStatus } : p
        )
      );

      setAlert({
        type: 'success',
        message: `Article marked as ${newStatus}.`,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to update post status.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Delete post
   */
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const postId = postToDelete._id || postToDelete.id;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
      setAlert({ type: 'success', message: 'Article permanently deleted.' });
    } catch (err) {
      console.error('Failed to delete post:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Could not delete article.',
      });
    } finally {
      setPostToDelete(null);
    }
  };

  // Metrics calculations
  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  // Filtered post list based on active tab
  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'published') return p.status === 'published';
    if (activeTab === 'draft') return p.status === 'draft';
    return true;
  });

  return (
    <div className="myblogs-container">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Top Header & CTA */}
      <div className="myblogs-header">
        <div>
          <h1 className="myblogs-title">My Articles</h1>
          <p className="myblogs-subtitle">
            Manage your drafts, published stories, and reader engagement.
          </p>
        </div>

        <Link to="/create-post" className="btn btn-primary create-btn">
          <FaPlus /> Create New Post
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <FaFileAlt />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">Total Stories</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <FaCheckCircle />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">{publishedCount}</span>
            <span className="stat-label">Published</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <FaEdit />
          </div>
          <div className="stat-text-group">
            <span className="stat-number">{draftCount}</span>
            <span className="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published ({publishedCount})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          Drafts ({draftCount})
        </button>
      </div>

      {/* Posts Table / List */}
      {loading ? (
        <LoadingSpinner message="Loading your dashboard..." />
      ) : filteredPosts.length === 0 ? (
        <div className="myblogs-empty-card">
          <div className="empty-icon-box">✍️</div>
          <h3 className="empty-heading">No articles found in this tab</h3>
          <p className="empty-subtext">
            {totalCount === 0
              ? "You haven't written any posts yet. Start writing!"
              : 'You have no articles matching this filter.'}
          </p>
          <Link to="/create-post" className="btn btn-primary">
            <FaPlus /> Write a Story
          </Link>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const postId = post._id || post.id;
                const formattedDate = post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A';

                return (
                  <tr key={postId}>
                    <td className="post-title-cell">
                      <Link to={`/post/${postId}`} className="table-title-link">
                        {post.title}
                      </Link>
                    </td>
                    <td>
                      <span className="table-category-tag">
                        {post.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          post.status === 'published'
                            ? 'badge-published'
                            : 'badge-draft'
                        }`}
                      >
                        {post.status || 'draft'}
                      </span>
                    </td>
                    <td className="table-date-cell">{formattedDate}</td>
                    <td className="table-actions-cell">
                      <div className="table-actions-group">
                        {/* Toggle Publish / Draft */}
                        <button
                          type="button"
                          className="action-btn toggle-status-btn"
                          onClick={() => handleToggleStatus(post)}
                          disabled={actionLoadingId === postId}
                          title={
                            post.status === 'published'
                              ? 'Unpublish to draft'
                              : 'Publish post'
                          }
                        >
                          {post.status === 'published' ? (
                            <>
                              <FaLock /> Unpublish
                            </>
                          ) : (
                            <>
                              <FaGlobe /> Publish
                            </>
                          )}
                        </button>

                        {/* Edit Link */}
                        <Link
                          to={`/edit-post/${postId}`}
                          className="action-btn edit-btn"
                          title="Edit post"
                        >
                          <FaEdit /> Edit
                        </Link>

                        {/* Delete Trigger */}
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => setPostToDelete(post)}
                          title="Delete post"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {postToDelete && (
        <div className="modal-overlay">
          <div className="modal-container" role="dialog" aria-modal="true">
            <h3 className="modal-title">Delete Article</h3>
            <p className="modal-body">
              Are you sure you want to permanently delete{' '}
              <strong>"{postToDelete.title}"</strong>? This will remove all associated
              comments and cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeletePost}
              >
                Delete Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBlogs;
