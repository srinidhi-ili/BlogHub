import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import '../styles/Auth.css';

/**
 * ============================================================================
 * Login Page Component
 * ============================================================================
 * Handles user authentication into the platform.
 *
 * Key Concepts:
 * 1. Controlled Form Inputs: Input values are stored in React component state
 *    (`formData`). Every keystroke triggers `handleChange`, ensuring the React
 *    state is always the single source of truth.
 * 2. Async Submission: `handleSubmit` prevents default browser page reload,
 *    performs client-side checks, and dispatches an asynchronous call to
 *    `useAuth().login(...)`.
 * 3. Graceful Feedback: Visual indicators for API error responses and a
 *    disabled/loading state on the submission button while the request resolves.
 * ============================================================================
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Controlled form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // UI status states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Where to redirect after successful login (default to home)
  const redirectPath = location.state?.from?.pathname || '/';

  // Handle keystrokes in input elements
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear previous error on user input
    if (error) setError('');
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation: ensure required fields are not empty
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      // On successful authentication, redirect user
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let serverMessage;
      if (err.response && err.response.data) {
        serverMessage = err.response.data.message || err.response.data.error;
      } else if (err.request) {
        serverMessage = 'Cannot connect to the server. Please make sure the backend is running on http://localhost:5000';
      } else {
        serverMessage = 'Invalid credentials. Please verify your email and password.';
      }
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to manage and share your stories</p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <FaEnvelope className="auth-input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                className="form-control auth-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <FaLock className="auth-input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                className="form-control auth-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              'Signing In...'
            ) : (
              <>
                <FaSignInAlt /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
