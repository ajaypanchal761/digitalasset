import { env } from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  // Create clean error object (avoid spreading Mongoose errors with read-only properties)
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
  };

  // Log error with stack trace in development
  if (env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else {
    // In production, log minimal info
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `${field} already exists. Please use a different value.`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again.';
    error = { message, statusCode: 401 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Create clean response object (no spreading, no read-only properties)
  const response = {
    success: false,
    message: message,
  };

  // Only add stack in development
  if (env.NODE_ENV === 'development' && typeof err.stack === 'string') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;



