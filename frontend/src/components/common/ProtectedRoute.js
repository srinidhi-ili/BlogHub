import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ============================================================================
 * ProtectedRoute Component
 * ============================================================================
 * What is a Protected Route?
 * In web applications, certain pages (like creating a blog, viewing your personal
 * dashboard, or managing drafts) should only be accessible to logged-in users.
 *
 * How it works:
 * 1. Checks `loading` state from `AuthContext`. If still verifying token, renders
 *    a loading spinner so we don't prematurely kick the user out.
 * 2. Checks `isAuthenticated`. If false, uses React Router's `<Navigate>` component
 *    to redirect the user to `/login`. We also preserve the current location in
 *    state so they can be redirected back after logging in.
 * 3. If authenticated, renders the protected `children` components.
 * ============================================================================
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading-container">
        <LoadingSpinner message="Verifying authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated visitors to /login, saving current path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
