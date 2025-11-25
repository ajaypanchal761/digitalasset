import express from 'express';
import {
  sendAdminOTP,
  registerAdmin,
  loginAdmin,
  loginAdminWithOTP,
  getAdminMe,
  updateAdminProfile,
  forgotAdminPassword,
  resetAdminPassword,
  getAdminBankDetails,
  updateAdminBankDetails,
} from '../controllers/adminAuth.controller.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply rate limiting to all admin auth routes
router.use(authLimiter);

router.post('/send-otp', sendAdminOTP);
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/login-otp', loginAdminWithOTP);
router.get('/me', adminProtect, getAdminMe);
router.put('/profile', adminProtect, updateAdminProfile);
router.get('/bank-details', getAdminBankDetails);
router.put('/bank-details', adminProtect, updateAdminBankDetails);
router.post('/forgot-password', forgotAdminPassword);
router.post('/reset-password', resetAdminPassword);

export default router;

