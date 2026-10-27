import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';
import '../styles/Auth.css';

/**
 * ============================================================================
 * Register Page Component
 * ============================================================================
 * Allows new users to create an account on BlogSpace.
 *
 * Client-Side Validation Rules:
 * 1. Name, email, password, and confirmPassword must not be empty.
 * 2. Password length must be at least 6 characters.
 * 3. Password and Confirm Password fields must match exactly.
 * ============================================================================
 */
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Controlled form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // UI status states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check required fields
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    // 2. Minimum password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 3. Confirm password matching
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send both name and username to accommodate backend schema requirements
      await register({
        name: formData.name.trim(),
        username: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // On successful registration, redirect to home page
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);

      // Determine the most helpful error message to display:
      // 1. If the backend returned an HTTP error response, extract its message
      // 2. If it's a network error (backend not running), tell the user clearly
      // 3. Fallback to a generic message only as a last resort
      let serverMessage;
      if (err.response && err.response.data) {
        // Backend returned an error response (e.g. 400, 409, 500)
        serverMessage = err.response.data.message || err.response.data.error;
      } else if (err.request) {
        // Request was sent but no response received — backend is unreachable
        serverMessage = 'Cannot connect to the server. Please make sure the backend is running on http://localhost:5000';
      } else {
        serverMessage = 'Registration failed. Please check your information and try again.';
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
          <h1 className="auth-title">Join BlogSpace</h1>
          <p className="auth-subtitle">Create an account to publish and connect</p>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name or Username
            </label>
            <div className="auth-input-wrapper">
              <FaUser className="auth-input-icon" />
              <input
                id="name"
                type="text"
                name="name"
                className="form-control auth-input"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

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
              Password (min. 6 characters)
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
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <FaLock className="auth-input-icon" />
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className="form-control auth-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
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
              'Creating Account...'
            ) : (
              <>
                <FaUserPlus /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
