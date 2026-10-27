import React from 'react';

/**
 * ============================================================================
 * LoadingSpinner Component
 * ============================================================================
 * Reusable animated circular spinner for visual feedback during asynchronous
 * operations (network fetches, route transitions, authentication checks).
 *
 * Props:
 * - `message` (string, optional): Contextual text displayed below the spinner circle.
 * - `size` (string, optional): 'small', 'medium', or 'large' (default 'medium').
 * ============================================================================
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className="loading-spinner-wrapper" role="status" aria-live="polite">
      <div className={`loading-spinner spinner-${size}`} aria-hidden="true" />
      {message && <p className="loading-spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
