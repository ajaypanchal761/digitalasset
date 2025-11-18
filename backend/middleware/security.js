import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import mongoSanitize from 'express-mongo-sanitize'; // Not compatible with Express 5
// import xss from 'xss-clean'; // Not compatible with Express 5
import hpp from 'hpp';
import { env } from '../config/env.js';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting - General API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - Auth routes (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting - Payment routes (very strict)
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many payment requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom NoSQL injection sanitization (Express 5 compatible)
export const sanitizeMongo = (req, res, next) => {
  try {
    // Sanitize req.body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Note: req.query is read-only in Express 5, so we can't modify it directly
    // The sanitization will happen at the controller level if needed
    
    // Sanitize req.params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    // If sanitization fails, continue anyway (don't block the request)
    console.warn('Sanitization warning:', error.message);
    next();
  }
};

// Helper function to sanitize objects recursively
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove MongoDB operators
        if (key.startsWith('$')) {
          continue; // Skip MongoDB operators
        }
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// Custom XSS sanitization (Express 5 compatible)
export const sanitizeXSS = (req, res, next) => {
  try {
    // Sanitize req.body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeXSSObject(req.body);
    }
    
    // Note: req.query is read-only in Express 5
    
    // Sanitize req.params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeXSSObject(req.params);
    }
    
    next();
  } catch (error) {
    // If sanitization fails, continue anyway
    console.warn('XSS sanitization warning:', error.message);
    next();
  }
};

// Helper function to sanitize XSS in objects
function sanitizeXSSObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Basic XSS sanitization - remove script tags and dangerous attributes
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeXSSObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeXSSObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// Prevent HTTP parameter pollution
export const preventHPP = hpp();

