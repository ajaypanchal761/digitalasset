import express from 'express';
import {
  register,
  login,
  sendOTP,
  verifyOTP,
  loginWithOTP,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login-otp', loginWithOTP);
router.get('/me', protect, getMe);

export default router;


