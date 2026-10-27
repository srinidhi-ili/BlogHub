/**
 * Main Application Server Entry Point
 *
 * Concepts for College / Viva Presentation:
 * 1. Express Application Lifecycle:
 *    - Initialize the Express application instance (`express()`).
 *    - Configure application-level middlewares (CORS, body parser, loggers).
 *    - Mount route handlers (e.g. /api/health, future auth and post routes).
 *    - Register centralized error handling middleware as the LAST middleware.
 *    - Bind and listen for incoming HTTP connections on a designated TCP port.
 *
 * 2. Middleware Order Matters:
 *    - Request parsing (express.json) and CORS must execute BEFORE routes.
 *    - Error handling middleware must be registered AFTER routes so it can catch
 *      unhandled errors forwarded via `next(err)`.
 */

// Step 1: Load environment variables from .env file into process.env
const dotenv = require('dotenv');
dotenv.config();

// Step 2: Import dependencies and custom modules
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Step 3: Connect to MongoDB database
connectDB();

// Step 4: Initialize Express application instance
const app = express();

// Step 5: Configure CORS (Cross-Origin Resource Sharing)
// Allows frontend (e.g., React on http://localhost:3000) to communicate with this backend API
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Step 6: Body Parser Middleware
// Parses incoming requests with JSON payloads (Content-Type: application/json)
// Makes parsed data accessible under req.body
app.use(express.json());

// Step 7: Test / Health Check Route
// Verifies that the API server is up and responsive
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blog Platform API is running'
  });
});

// Step 8: Mount Application Route Handlers (Phase 2 & Phase 3)
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes);
app.use('/api/admin', adminRoutes);

// Step 9: Centralized Error Handler Middleware
// Must be registered after all route definitions so it catches errors thrown inside them
app.use(errorHandler);

// Step 10: Start HTTP Server and Listen on Port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] Blog Platform API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g. database disconnect during runtime)
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  // In production, consider closing the server gracefully:
  // server.close(() => process.exit(1));
});

module.exports = app;
