
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaPlus,
  FaShieldAlt,
  FaSignOutAlt,
  FaChartBar,
} from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navbar.css';

/**
 * ============================================================================
 * Navbar Component
 * ============================================================================
 * Primary navigation header for the application.
 *
 * Capabilities:
 * - Dynamic links based on authentication and authorization:
 *   * Public: Home, Explore
 *   * Logged-in Users: Dashboard, Create Post
 *   * Admin Users: Admin Dashboard
 *   * Unauthenticated: Login, Register
 *   * Authenticated: Username display + Logout button
 * - Active link highlighting managed via React Router's useLocation() hook.
 * - Mobile responsive drawer menu with toggle state.
 * ============================================================================
 */
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Helper function to test whether a given link path is active
  const isPathActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const displayName =
    user?.name || user?.username || user?.email?.split('@')[0] || 'Writer';

  return (
    <header className="navbar-header">
      <nav className="navbar-container" aria-label="Primary Navigation">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-accent">Blog</span>Space
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={toggleMenu}
          aria-label={
            mobileMenuOpen
              ? 'Close navigation menu'
              : 'Open navigation menu'
          }
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Nav Links and User Actions */}
        <div className={`navbar-content ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Main Navigation Links */}
          <ul className="navbar-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${isPathActive('/') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                to="/explore"
                className={`nav-link ${
                  isPathActive('/explore') ? 'active' : ''
                }`}
                onClick={closeMenu}
              >
                Explore
              </Link>
            </li>

            {/* Authenticated Author Links */}
            {isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${
                      isPathActive('/dashboard') ? 'active' : ''
                    }`}
                    onClick={closeMenu}
                  >
                    <FaChartBar className="nav-item-icon" /> Dashboard
                  </Link>
                </li>

                <li>
                  <Link
                    to="/create-post"
                    className={`nav-link ${
                      isPathActive('/create-post') ? 'active' : ''
                    }`}
                    onClick={closeMenu}
                  >
                    <FaPlus className="nav-item-icon" /> Create Post
                  </Link>
                </li>
              </>
            )}

            {/* Administrator Only Link */}
            {isAuthenticated && isAdmin && (
              <li>
                <Link
                  to="/admin"
                  className={`nav-link ${
                    isPathActive('/admin') ? 'active' : ''
                  }`}
                  onClick={closeMenu}
                >
                  <FaShieldAlt className="nav-item-icon" /> Admin
                </Link>
              </li>
            )}
          </ul>

          {/* Right-side Auth Controls */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <div className="navbar-user-info">
                <span
                  className="navbar-username"
                  title={user?.email || displayName}
                >
                  <FaUserCircle className="user-icon" />
                  <span className="username-text">{displayName}</span>
                  {isAdmin && <span className="admin-pill">Admin</span>}
                </span>

                <button
                  type="button"
                  className="btn btn-outline btn-logout"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className={`btn btn-outline ${
                    isPathActive('/login') ? 'active' : ''
                  }`}
                  onClick={closeMenu}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
