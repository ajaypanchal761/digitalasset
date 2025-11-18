import express from 'express';
import {
  getUsers,
  getUserDetail,
  updateUserStatus,
  creditWallet,
  debitWallet,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getDashboardStats,
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/:id/wallet/credit', creditWallet);
router.post('/users/:id/wallet/debit', debitWallet);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

export default router;


