import express from 'express';
import {
  getUsers,
  getUserDetail,
  updateUserStatus,
  creditWallet,
  debitWallet,
  deleteUser,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getDashboardStats,
  getTransferRequests,
  approveTransferRequest,
  rejectTransferRequest,
} from '../controllers/admin.controller.js';
import {
  getPayouts,
  processPayouts,
  getPayoutHistory,
  generateMonthlyPayouts,
} from '../controllers/payout.controller.js';
import {
  getAdminInvestmentRequests,
  approveInvestmentRequest,
  rejectInvestmentRequest,
} from '../controllers/investmentRequest.controller.js';
import { admin } from '../middleware/admin.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
// The admin middleware uses adminProtect which handles both authentication and admin verification
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/:id/wallet/credit', creditWallet);
router.post('/users/:id/wallet/debit', debitWallet);
router.delete('/users/:id', deleteUser);
router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

// Investment request routes
router.get('/investment-requests', getAdminInvestmentRequests);
router.put('/investment-requests/:id/approve', approveInvestmentRequest);
router.put('/investment-requests/:id/reject', rejectInvestmentRequest);

// Payout routes
router.get('/payouts', getPayouts);
router.post('/payouts/process', processPayouts);
router.get('/payouts/history', getPayoutHistory);
router.post('/payouts/generate', generateMonthlyPayouts);

// Transfer request routes
router.get('/transfer-requests', getTransferRequests);
router.put('/transfer-requests/:id/approve', approveTransferRequest);
router.put('/transfer-requests/:id/reject', rejectTransferRequest);

export default router;


