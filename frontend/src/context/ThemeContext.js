import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * ============================================================================
 * Theme Context – Dark Mode Support
 * ============================================================================
 * Stores the user's theme preference ('light' or 'dark') in localStorage
 * so it persists across page refreshes and browser sessions.
 *
 * How it works:
 * 1. On load, read the saved theme from localStorage (fallback to 'light').
 * 2. Apply a data-theme attribute to <html> so CSS variables switch instantly.
 * 3. Provide a toggleTheme() function that any component can call.
 * ============================================================================
 */
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('blogspace-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Sync to DOM and localStorage whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('blogspace-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
