import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCalendarAlt } from 'react-icons/fa';
import '../../styles/PostCard.css';

/**
 * ============================================================================
 * PostCard Component
 * ============================================================================
 * Reusable card element representing a single blog article in grid or list feeds.
 *
 * Props:
 * - `post`: Object containing article details:
 *    - `_id` / `id`: Unique identifier
 *    - `title`: Article title
 *    - `summary`: Short excerpt (truncated to ~100 chars)
 *    - `author`: Author string or object { name, username }
 *    - `category`: Category string (e.g. Technology, Health)
 *    - `createdAt` / `publishedAt` / `date`: Timestamp
 * ============================================================================
 */
const PostCard = ({ post }) => {
  const navigate = useNavigate();

  if (!post) return null;

  const postId = post._id || post.id;

  // Extract author display name safely
  const authorName =
    typeof post.author === 'string'
      ? post.author
      : post.author?.name || post.author?.username || 'Anonymous Writer';

  // Format date cleanly
  const rawDate = post.publishedAt || post.createdAt || post.date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  // Truncate summary to ~100 characters if longer
  const truncateText = (text, maxLength = 100) => {
    if (!text) return 'Read more about this article...';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Convert category to lower-dash class for styling
  const categoryName = post.category || 'Other';
  const categoryClass = `badge-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const handleCardClick = () => {
    navigate(`/post/${postId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/post/${postId}`);
    }
  };

  return (
    <article
      className="post-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${post.title}`}
    >
      <div className="post-card-header">
        <span className={`category-badge ${categoryClass}`}>
          {categoryName}
        </span>
        <div className="post-meta-date">
          <FaCalendarAlt className="meta-icon" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="post-card-body">
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-summary">
          {truncateText(post.summary || post.content, 110)}
        </p>
      </div>

      <div className="post-card-footer">
        <div className="post-author-info">
          <FaUser className="author-icon" />
          <span className="author-name">{authorName}</span>
        </div>
        <span className="read-more-text">Read story &rarr;</span>
      </div>
    </article>
  );
};

export default PostCard;
