import axios from 'axios';

/**
 * Axios Instance Configuration
 * ----------------------------
 * An axios instance allows us to define a custom configuration like baseURL
 * and default headers. This means we don't have to repeatedly type out the full
 * backend API URL (e.g., http://localhost:5000/api) for every network call.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Axios Request Interceptor
 * -------------------------
 * What is an interceptor?
 * Think of an interceptor like a checkpoint or toll booth on a highway.
 * Before any outgoing HTTP request leaves our React app, this request interceptor runs.
 *
 * Here, we check if the user has a stored JWT authentication token in localStorage.
 * If found, we automatically attach it to the `Authorization` header as `Bearer <token>`.
 * This way, protected backend endpoints can verify who is making the request without us
 * having to manually include the token in every single API call.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Forward the error if the request configuration failed
    return Promise.reject(error);
  }
);

/**
 * Axios Response Interceptor
 * --------------------------
 * The response interceptor intercepts incoming HTTP responses before they reach
 * your .then() or .catch() handlers in your components or services.
 *
 * Why handle 401 Unauthorized here?
 * A 401 status indicates that our session is invalid or expired. Instead of
 * duplicating token-clearing and redirect logic across every component,
 * we handle it globally:
 * 1. Clear the invalid token from localStorage.
 * 2. Redirect the user to the /login page (preventing infinite loops if already there).
 */
api.interceptors.response.use(
  (response) => {
    // Return the response directly if status is 2xx
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Remove invalid/expired JWT token from browser storage
      localStorage.removeItem('token');

      // Redirect to login if user isn't already on an auth page
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
