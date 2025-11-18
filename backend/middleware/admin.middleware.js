import { protect } from './auth.middleware.js';

export const admin = async (req, res, next) => {
  // First check if user is authenticated
  await protect(req, res, () => {
    // Then check if user is admin
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }
  });
};



