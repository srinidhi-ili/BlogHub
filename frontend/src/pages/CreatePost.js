import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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
 * CreatePost Page Component
 * ============================================================================
 * Controlled authoring interface for composing new blog posts.
 *
 * Controlled Component Pattern:
 * In React, form inputs whose values are bound to React state and controlled via
 * `onChange` events are called "Controlled Components". This ensures the React
 * state is the authoritative truth, enabling features like:
 * - Real-time word count calculation.
 * - Enforcing max character limits (summary <= 300 chars).
 * - Instant read-mode live previewing without network calls.
 *
 * Submission:
 * Can be dispatched as either 'draft' or 'published' status via POST /posts.
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

const CreatePost = () => {
  const navigate = useNavigate();

  // Controlled form state
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Technology',
  });

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Enforce 300 char limit on summary
    if (name === 'summary' && value.length > 300) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper calculations
  const summaryCharsRemaining = 300 - formData.summary.length;
  const wordCount = formData.content.trim()
    ? formData.content.trim().split(/\s+/).length
    : 0;

  // Validation & Submission
  const handleSubmit = async (targetStatus) => {
    // Basic validation
    if (!formData.title.trim()) {
      setAlert({ type: 'error', message: 'Article title is required.' });
      return;
    }
    if (!formData.summary.trim()) {
      setAlert({ type: 'error', message: 'Article summary is required.' });
      return;
    }
    if (!formData.content.trim()) {
      setAlert({ type: 'error', message: 'Article content cannot be empty.' });
      return;
    }
    if (!formData.category) {
      setAlert({ type: 'error', message: 'Please select a valid category.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      await api.post('/posts', {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        category: formData.category,
        status: targetStatus, // 'draft' or 'published'
      });

      // Redirect author to their blogs management dashboard
      navigate('/my-blogs');
    } catch (err) {
      console.error('Failed to create post:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Error creating post. Please try again.',
      });
      setSubmitting(false);
    }
  };

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
        <h1 className="editor-heading">Create New Story</h1>

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
        /* Read-mode Live Preview (mirrors BlogDetail format) */
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
                <span>Today</span>
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
        /* Edit Mode Form */
        <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
          {/* Title Input */}
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

          {/* Category Dropdown */}
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

          {/* Summary Input */}
          <div className="form-group">
            <div className="label-with-counter">
              <label htmlFor="summary" className="form-label">
                Summary (Brief teaser for cards)
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
              placeholder="Write a captivating 1-2 sentence hook for your article..."
              value={formData.summary}
              onChange={handleChange}
              required
            />
          </div>

          {/* Main Content Textarea */}
          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Article Content
            </label>
            <textarea
              id="content"
              name="content"
              className="form-control editor-content-textarea"
              placeholder="Tell your story... Write clearly and with passion."
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          {/* Form Action Buttons */}
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
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
              >
                <FaSave /> Save as Draft
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSubmit('published')}
                disabled={submitting}
              >
                <FaPaperPlane /> Publish Post
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreatePost;
