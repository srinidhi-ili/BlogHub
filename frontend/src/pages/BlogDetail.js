import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/blog/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';
import {
  FaArrowLeft,
  FaUser,
  FaCalendarAlt,
  FaTag,
  FaTrashAlt,
  FaCommentDots,
  FaPaperPlane,
} from 'react-icons/fa';
import '../styles/BlogDetail.css';

/**
 * ============================================================================
 * BlogDetail Page Component
 * ============================================================================
 * Full-read article view with nested comments and category recommendations.
 *
 * Capabilities:
 * 1. Post Fetching: Retrieves article data from GET /posts/:id.
 * 2. Nested Commenting System:
 *    - Fetches discussion from GET /posts/:id/comments.
 *    - Authenticated users can post comments via POST /posts/:id/comments.
 *    - Author of a comment or an Admin can delete via DELETE /comments/:commentId.
 * 3. Related Posts: Queries posts sharing the same category and renders up to
 *    3 recommendation cards (excluding current post).
 * 4. Confirmation Dialog: Prevents accidental comment deletion.
 * ============================================================================
 */
const BlogDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Core article states
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Comments states
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Modal & alert states
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [alert, setAlert] = useState(null);

  // Related posts
  const [relatedPosts, setRelatedPosts] = useState([]);

  /**
   * Fetch primary post details
   */
  const fetchPostDetails = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const response = await api.get(`/posts/${id}`);
      const postData = response.data.post || response.data.data || response.data;
      if (!postData || !postData.title) {
        setNotFound(true);
        return;
      }
      setPost(postData);

      // Fetch related posts by category once article is resolved
      if (postData.category) {
        try {
          const relatedRes = await api.get('/posts', {
            params: { category: postData.category, limit: 4 },
          });
          const rawRelated =
            relatedRes.data.posts || relatedRes.data.data || relatedRes.data;
          if (Array.isArray(rawRelated)) {
            const filtered = rawRelated
              .filter((p) => (p._id || p.id) !== id)
              .slice(0, 3);
            setRelatedPosts(filtered);
          }
        } catch (err) {
          console.warn('Failed to fetch related posts:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setAlert({
          type: 'error',
          message: 'Unable to load post. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Fetch comments list for this article
   */
  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/posts/${id}/comments`);
      const commentData =
        response.data.comments || response.data.data || response.data;
      if (Array.isArray(commentData)) {
        setComments(commentData);
      }
    } catch (err) {
      // Endpoint may return 404 or empty if no comments exist yet
      console.warn('Comments fetch info:', err.message);
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    fetchPostDetails();
    fetchComments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchPostDetails, fetchComments]);

  /**
   * Handle new comment submission
   */
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.post(`/posts/${id}/comments`, {
        content: newComment.trim(),
      });

      const created =
        response.data.comment || response.data.data || response.data;

      // Add new comment to state or re-fetch comments
      if (created && created._id) {
        setComments((prev) => [created, ...prev]);
      } else {
        fetchComments();
      }

      setNewComment('');
      setAlert({ type: 'success', message: 'Comment posted successfully!' });
    } catch (err) {
      console.error('Failed to post comment:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to post comment.',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  /**
   * Handle comment deletion
   */
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await api.delete(`/comments/${commentToDelete._id || commentToDelete.id}`);
      setComments((prev) =>
        prev.filter(
          (c) => (c._id || c.id) !== (commentToDelete._id || commentToDelete.id)
        )
      );
      setAlert({ type: 'success', message: 'Comment removed.' });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.error || err.response?.data?.message || 'Could not delete comment.',
      });
    } finally {
      setCommentToDelete(null);
    }
  };

  /**
   * Check if current user is permitted to delete a given comment
   */
  const canDeleteComment = (comment) => {
    if (!user) return false;
    if (isAdmin) return true;
    const authorId = comment.author?._id || comment.author?.id || comment.author;
    const currentUserId = user._id || user.id;
    return authorId === currentUserId;
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="article-loading-state">
        <LoadingSpinner message="Loading article..." size="large" />
      </div>
    );
  }

  // 2. 404 Not Found State
  if (notFound || !post) {
    return (
      <div className="article-not-found-container">
        <div className="not-found-box">
          <span className="not-found-badge">404</span>
          <h1 className="not-found-heading">Article Not Found</h1>
          <p className="not-found-message">
            The article you are searching for does not exist or may have been removed.
          </p>
          <Link to="/explore" className="btn btn-primary">
            <FaArrowLeft /> Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Extract article author and dates
  const authorName =
    typeof post.author === 'string'
      ? post.author
      : post.author?.name || post.author?.username || 'Staff Writer';

  const publishedDate = post.publishedAt || post.createdAt;
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="blog-detail-wrapper">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Back to Explore Navigation Link */}
      <div className="back-nav-container">
        <Link to="/explore" className="back-link">
          <FaArrowLeft /> Back to Explore
        </Link>
      </div>

      {/* Main Article Document */}
      <article className="article-main">
        <header className="article-header">
          <div className="article-category-row">
            <span className="article-category-badge">
              <FaTag className="tag-icon" /> {post.category || 'General'}
            </span>
          </div>

          <h1 className="article-title">{post.title}</h1>

          {post.summary && (
            <p className="article-summary-lead">{post.summary}</p>
          )}

          <div className="article-meta-bar">
            <div className="article-author-info">
              <div className="author-avatar-placeholder">
                <FaUser />
              </div>
              <div className="author-text">
                <span className="author-name-text">{authorName}</span>
                <span className="meta-subtext">Author</span>
              </div>
            </div>

            <div className="article-date-info">
              <FaCalendarAlt className="meta-icon" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </header>

        {/* Full Content Body */}
        <section className="article-content-body">
          {post.content ? (
            post.content.split('\n').map((paragraph, index) => {
              if (!paragraph.trim()) return null;
              return <p key={index}>{paragraph}</p>;
            })
          ) : (
            <p>No content available for this post.</p>
          )}
        </section>
      </article>

      {/* Comments Section */}
      <section className="comments-section">
        <div className="comments-header">
          <h2 className="comments-title">
            <FaCommentDots className="comments-icon" />
            Discussion ({comments.length})
          </h2>
        </div>

        {/* Comment Submission Form */}
        {isAuthenticated ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <label htmlFor="commentText" className="comment-form-label">
              Leave a thoughtful response
            </label>
            <textarea
              id="commentText"
              rows={3}
              className="comment-textarea"
              placeholder="What are your thoughts on this story?..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div className="comment-form-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingComment || !newComment.trim()}
              >
                {submittingComment ? (
                  'Posting...'
                ) : (
                  <>
                    <FaPaperPlane /> Post Comment
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="comment-login-prompt">
            <p>
              Join the conversation!{' '}
              <Link to="/login" className="login-link">
                Sign in
              </Link>{' '}
              or{' '}
              <Link to="/register" className="login-link">
                create an account
              </Link>{' '}
              to share your thoughts.
            </p>
          </div>
        )}

        {/* Comments Feed */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments-text">
              No comments yet. Be the first to share your perspective!
            </p>
          ) : (
            comments.map((comment) => {
              const commentAuthor =
                typeof comment.author === 'string'
                  ? comment.author
                  : comment.author?.name ||
                    comment.author?.username ||
                    'Reader';

              const commentDate = comment.createdAt
                ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Just now';

              return (
                <div
                  key={comment._id || comment.id}
                  className="comment-item"
                >
                  <div className="comment-item-header">
                    <div className="comment-author-group">
                      <div className="comment-avatar">
                        <FaUser />
                      </div>
                      <div className="comment-meta">
                        <span className="comment-author-name">
                          {commentAuthor}
                        </span>
                        <span className="comment-date">{commentDate}</span>
                      </div>
                    </div>

                    {canDeleteComment(comment) && (
                      <button
                        type="button"
                        className="comment-delete-btn"
                        onClick={() => setCommentToDelete(comment)}
                        title="Delete comment"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Related Posts Recommendations */}
      {relatedPosts.length > 0 && (
        <section className="related-posts-section">
          <h2 className="related-title">Related Stories</h2>
          <div className="related-posts-grid">
            {relatedPosts.map((rPost) => (
              <PostCard key={rPost._id || rPost.id} post={rPost} />
            ))}
          </div>
        </section>
      )}

      {/* Comment Deletion Confirmation Modal */}
      {commentToDelete && (
        <div className="modal-overlay">
          <div className="modal-container" role="dialog" aria-modal="true">
            <h3 className="modal-title">Delete Comment</h3>
            <p className="modal-body">
              Are you sure you want to remove this comment? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCommentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteComment}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;
