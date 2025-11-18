import mongoose from 'mongoose';
import { env } from './env.js';

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      const conn = await mongoose.connect(env.MONGODB_URI, options);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      });

      return;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection failed (Attempt ${retries}/${maxRetries}):`, error.message);

      if (retries >= maxRetries) {
        console.error('❌ Failed to connect to MongoDB after maximum retries');
        process.exit(1);
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
};

export default connectDB;



