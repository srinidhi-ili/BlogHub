import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import {
  FaEye,
  FaEdit,
  FaSave,
  FaPaperPlane,
  FaCalendarAlt,
  FaTag,
} from 'react-icons/fa';
import '../styles/Editor.css';

/**
 * ============================================================================
 * EditPost Page Component
 * ============================================================================
 * Allows authors (or administrators) to modify an existing blog article.
 *
 * Flow:
 * 1. Queries GET /posts/:id on component mount.
 * 2. Pre-populates all controlled inputs with the existing title, summary,
 *    content, category, and status.
 * 3. Enforces authorization check: Verifies that the logged-in user is either
 *    the post's author or an admin.
 * 4. Submits updates via PUT /posts/:id.
 * ============================================================================
 */
const CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Education',
  'Health',
  'Travel',
  'Food',
  'Sports',
  'Entertainment',
  'Science',
  'Other',
];

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Controlled form state
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Technology',
    status: 'draft',
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  /**
   * Fetch existing article details
   */
  useEffect(() => {
    const fetchExistingPost = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/posts/${id}`);
        const post = response.data.post || response.data.data || response.data;

        if (!post) {
          setAlert({ type: 'error', message: 'Article not found.' });
          setLoading(false);
          return;
        }

        // Author validation check
        const authorId = post.author?._id || post.author?.id || post.author;
        const currentUserId = user?._id || user?.id;

        if (!isAdmin && authorId && currentUserId && authorId !== currentUserId) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        // Pre-fill form state
        setFormData({
          title: post.title || '',
          summary: post.summary || '',
          content: post.content || '',
          category: post.category || 'Technology',
          status: post.status || 'draft',
        });
      } catch (err) {
        console.error('Error fetching post for editing:', err);
        setAlert({
          type: 'error',
          message: err.response?.data?.error || err.response?.data?.message || 'Could not load article for editing.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExistingPost();
  }, [id, user, isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'summary' && value.length > 300) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const summaryCharsRemaining = 300 - formData.summary.length;
  const wordCount = formData.content.trim()
    ? formData.content.trim().split(/\s+/).length
    : 0;

  const handleUpdate = async (targetStatus) => {
    if (!formData.title.trim()) {
      setAlert({ type: 'error', message: 'Title cannot be blank.' });
      return;
    }
    if (!formData.summary.trim()) {
      setAlert({ type: 'error', message: 'Summary cannot be blank.' });
      return;
    }
    if (!formData.content.trim()) {
      setAlert({ type: 'error', message: 'Article content cannot be empty.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      await api.put(`/posts/${id}`, {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        category: formData.category,
        status: targetStatus || formData.status,
      });

      navigate('/my-blogs');
    } catch (err) {
      console.error('Failed to update post:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to update post.',
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="route-loading-container">
        <LoadingSpinner message="Loading article for editing..." />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="article-not-found-container">
        <div className="not-found-box">
          <h2 className="not-found-heading">Unauthorized Action</h2>
          <p className="not-found-message">
            You do not have permission to edit this post. Only the author or an
            administrator can modify it.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/my-blogs')}
          >
            Go to My Blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page-container">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Editor Header Bar */}
      <div className="editor-top-bar">
        <div>
          <h1 className="editor-heading">Edit Post</h1>
          <span className={`status-pill status-${formData.status}`}>
            Current Status: {formData.status.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline preview-toggle-btn"
          onClick={() => setPreviewMode((prev) => !prev)}
        >
          {previewMode ? (
            <>
              <FaEdit /> Back to Edit
            </>
          ) : (
            <>
              <FaEye /> Live Preview
            </>
          )}
        </button>
      </div>

      {previewMode ? (
        /* Live Preview Mode */
        <div className="editor-preview-card">
          <div className="preview-watermark">PREVIEW MODE</div>
          <header className="article-header">
            <span className="article-category-badge">
              <FaTag /> {formData.category}
            </span>
            <h1 className="article-title">{formData.title || 'Untitled Post'}</h1>
            {formData.summary && (
              <p className="article-summary-lead">{formData.summary}</p>
            )}
            <div className="article-meta-bar">
              <span className="meta-subtext">Word count: {wordCount} words</span>
              <div className="article-date-info">
                <FaCalendarAlt className="meta-icon" />
                <span>Last edited now</span>
              </div>
            </div>
          </header>

          <section className="article-content-body">
            {formData.content ? (
              formData.content.split('\n').map((para, i) => (
                <p key={i}>{para || '\u00A0'}</p>
              ))
            ) : (
              <p className="preview-empty-text">No content typed yet.</p>
            )}
          </section>
        </div>
      ) : (
        /* Edit Form */
        <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <input
              type="text"
              name="title"
              className="editor-title-input"
              placeholder="Title of your story..."
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="editor-meta-row">
            <div className="form-group category-select-group">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="form-control editor-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="editor-stats-badges">
              <span className="stat-pill">Words: {wordCount}</span>
            </div>
          </div>

          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="summary" className="form-label">
                Summary
              </label>
              <span
                className={`char-counter ${
                  summaryCharsRemaining <= 30 ? 'counter-warning' : ''
                }`}
              >
                {summaryCharsRemaining} chars left
              </span>
            </div>
            <textarea
              id="summary"
              name="summary"
              rows={3}
              className="form-control editor-summary-input"
              placeholder="Write a captivating summary..."
              value={formData.summary}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Article Content
            </label>
            <textarea
              id="content"
              name="content"
              className="form-control editor-content-textarea"
              placeholder="Write your article..."
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div className="editor-actions-bar">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/my-blogs')}
              disabled={submitting}
            >
              Cancel
            </button>

            <div className="action-buttons-group">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleUpdate('draft')}
                disabled={submitting}
              >
                <FaSave /> Save as Draft
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleUpdate('published')}
                disabled={submitting}
              >
                <FaPaperPlane /> Publish Changes
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditPost;
