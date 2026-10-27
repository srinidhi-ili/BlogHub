import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ============================================================================
 * AdminRoute Component
 * ============================================================================
 * What is Role-Based Access Control (RBAC)?
 * In addition to being logged in, certain sensitive sections of an application
 * (such as system analytics, user management, and global moderation) are reserved
 * exclusively for administrators.
 *
 * How it works:
 * 1. Checks `loading` state to ensure user profile hydration is complete.
 * 2. Checks `isAuthenticated`. If not logged in, redirects to `/login`.
 * 3. Checks `isAdmin` (e.g. `user?.role === 'admin'`). If user is authenticated
 *    but not an administrator, redirects them to the home page (`/`).
 * 4. If all checks pass, grants access to the admin `children`.
 * ============================================================================
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading-container">
        <LoadingSpinner message="Checking administrator privileges..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // If authenticated but not an admin, redirect to home page
    return <Navigate to="/" state={{ unauthorizedMessage: 'Admin access required.' }} replace />;
  }

  return children;
};

export default AdminRoute;
