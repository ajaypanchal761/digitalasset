import { adminProtect } from './adminAuth.middleware.js';

export const admin = async (req, res, next) => {
  // Use adminProtect to verify admin authentication
  // adminProtect already checks if the user is from Admin model
  await adminProtect(req, res, next);
};



