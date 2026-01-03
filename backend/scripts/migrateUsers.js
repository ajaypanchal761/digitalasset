import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

/**
 * Migration script to add kycVerifications field to existing users
 */
const migrateUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Update all users who don't have kycVerifications field
    const result = await User.updateMany(
      { kycVerifications: { $exists: false } },
      {
        $set: {
          kycVerifications: {
            panVerified: false,
            aadhaarVerified: false,
            bankVerified: false
          }
        }
      }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} users`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsers();
