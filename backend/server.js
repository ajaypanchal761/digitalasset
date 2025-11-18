import './config/env.js'; // Load and validate environment variables
import connectDB from './config/db.js';
import app from './app.js';
import { env } from './config/env.js';

let server;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Connect to database
connectDB().catch((err) => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});

// Start server
server = app.listen(env.PORT, () => {
  console.log('🚀 Server Started');
  console.log(`📍 Port: ${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`⏰ ${new Date().toLocaleString()}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('✅ HTTP server closed');

    // Close database connection
    import('mongoose').then((mongoose) => {
      mongoose.default.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        console.log('👋 Process terminated');
        process.exit(0);
      });
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));



