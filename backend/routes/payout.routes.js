import express from 'express';
import {
  getPayouts,
  processPayouts,
  getPayoutHistory,
  getUserPayouts,
  generateMonthlyPayouts,
} from '../controllers/payout.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Admin routes
router.get('/admin/payouts', protect, admin, getPayouts);
router.post('/admin/payouts/process', protect, admin, processPayouts);
router.get('/admin/payouts/history', protect, admin, getPayoutHistory);
router.post('/admin/payouts/generate', protect, admin, generateMonthlyPayouts);

// User routes
router.get('/', protect, getUserPayouts);

export default router;

