import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import {
  securityHeaders,
  apiLimiter,
  sanitizeMongo,
  sanitizeXSS,
  preventHPP,
} from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware (must be first)
app.use(securityHeaders);

// CORS configuration
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(sanitizeMongo); // Prevent NoSQL injection
app.use(sanitizeXSS); // Prevent XSS attacks
app.use(preventHPP); // Prevent HTTP parameter pollution

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting (apply to all routes)
app.use('/api', apiLimiter);

// Routes
import routes from './routes/index.js';
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app;


