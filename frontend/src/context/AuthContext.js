import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

/**
 * ============================================================================
 * React Context & Authentication State
 * ============================================================================
 * What is React Context?
 * In React, data is typically passed top-down (parent to child) via props.
 * However, this can become clumsy for data like the current user, theme, or
 * authentication state that is required by many components throughout an app.
 * This issue is known as "prop drilling".
 *
 * React Context solves this by allowing components to share state globally
 * without having to explicitly pass props through every intermediate component.
 *
 * Why use Context for Auth?
 * 1. Global availability: Components like Navbar, ProtectedRoute, and Comment
 *    forms all need to know if a user is logged in.
 * 2. Centralized state management: Login, registration, and logout operations
 *    are handled in one place, ensuring consistency across the entire UI.
 * ============================================================================
 */

// 1. Create the Context object
const AuthContext = createContext(null);

// 2. AuthProvider Component wraps the app and provides authentication state
export const AuthProvider = ({ children }) => {
  // Current logged in user object (null if unauthenticated)
  const [user, setUser] = useState(null);

  // JWT token initialized from browser's localStorage
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Loading state indicates whether we are verifying the user session on initial load
  const [loading, setLoading] = useState(true);

  /**
   * On initial component mount:
   * Check if a token exists in localStorage. If it does, fetch the user profile
   * from the backend (/auth/me) to re-hydrate user state and verify validity.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Call GET /auth/me to fetch authenticated user profile
          const response = await api.get('/auth/me');
          // Handle backend response format: response.data.user or response.data
          const userData = response.data.user || response.data;
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Session validation failed. Token may be expired or invalid:', error);
          // Token is invalid: clean up state
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login Handler
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const receivedToken = response.data.token;
    const receivedUser = response.data.user || response.data;

    if (receivedToken) {
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
    }
    setUser(receivedUser);
    return response.data;
  };

  /**
   * Register Handler
   * @param {Object} userData - { username, email, password }
   */
  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const receivedToken = response.data.token;
    const receivedUser = response.data.user || response.data;

    if (receivedToken) {
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
    }
    setUser(receivedUser);
    return response.data;
  };

  /**
   * Logout Handler
   * Clears token from localStorage and resets state.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Computed booleans for clean conditional rendering in components
  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'admin';

  // Value object provided to all consumer components
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Custom Hook
 * -------------------
 * Provides an easy and clean way for components to access the AuthContext.
 * Instead of writing `useContext(AuthContext)` in every file, components simply
 * import and call `useAuth()`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
