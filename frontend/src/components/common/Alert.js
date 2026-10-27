import React, { useEffect } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';

/**
 * ============================================================================
 * Alert Component
 * ============================================================================
 * A reusable notification toast for user feedback.
 *
 * Features:
 * - Types: 'success', 'error', 'info', or 'warning'
 * - Auto-dismiss: Automatically invokes `onClose` after 5 seconds (5000ms)
 * - Clean icon and close button for manual dismissal
 * ============================================================================
 */
const Alert = ({ type = 'info', message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (!message || !onClose) return;

    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Cleanup timer if component unmounts or message changes
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="alert-icon" />;
      case 'error':
        return <FaExclamationCircle className="alert-icon" />;
      case 'info':
      default:
        return <FaInfoCircle className="alert-icon" />;
    }
  };

  return (
    <div className={`alert-toast alert-${type}`} role="alert">
      <div className="alert-content">
        {renderIcon()}
        <span className="alert-message">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Close alert"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Alert;
