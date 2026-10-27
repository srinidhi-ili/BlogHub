/**
 * Centralized Error Handling Middleware & Custom Error Class
 *
 * Concepts for College / Viva Presentation:
 * 1. Express Middleware:
 *    - Middleware functions have access to the request object (req), the response object (res),
 *      and the next middleware function in the application's request-response cycle.
 *    - Error-handling middleware functions are defined with four arguments instead of three:
 *      (err, req, res, next). Express recognizes this signature and only invokes it when next(err) is called
 *      or an unhandled exception is thrown in route handlers.
 * 2. Why Centralized Error Handling?
 *    - Avoids repetitive try/catch blocks with duplicate res.status(500)... code across controllers.
 *    - Formats error responses uniformly for the frontend/API consumer.
 *    - Converts raw database exceptions (like Mongoose CastError or duplicate keys) into friendly user messages.
 */

/**
 * Custom ErrorResponse class extending native Error
 * Allows passing an HTTP status code alongside the error message.
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Captures current stack trace omitting this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express Error Handling Middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error stack to console in development
  console.error(`[Error Handler] ${err.name || 'Error'}: ${err.message}`);

  // 1. Mongoose Bad ObjectId (CastError)
  // Occurs when user provides a malformed MongoDB ObjectID in the URL/params
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  // Occurs when violating a unique index constraint (e.g., duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for '${field}'. That value already exists.`;
    error = new ErrorResponse(message, 400);
  }

  // 3. Mongoose Validation Error (ValidationError)
  // Occurs when input fails Mongoose schema validation rules (required, minlength, enum, etc.)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ErrorResponse(message, 400);
  }

  // Send standardized JSON error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};

module.exports = {
  ErrorResponse,
  errorHandler
};
