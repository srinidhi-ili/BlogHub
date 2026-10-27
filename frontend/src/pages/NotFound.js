import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaCompass } from 'react-icons/fa';

/**
 * ============================================================================
 * NotFound Page Component (404 Fallback)
 * ============================================================================
 * Displayed whenever a user navigates to an unrecognized URL route.
 * ============================================================================
 */
const NotFound = () => {
  return (
    <div className="article-not-found-container">
      <div className="not-found-box">
        <span className="not-found-badge">404</span>
        <h1 className="not-found-heading">Page Not Found</h1>
        <p className="not-found-message">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            <FaHome /> Back to Home
          </Link>
          <Link to="/explore" className="btn btn-outline">
            <FaCompass /> Explore Stories
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
