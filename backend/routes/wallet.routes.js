import express from 'express';
import {
  getWallet,
  getTransactions,
} from '../controllers/wallet.controller.js';
import { getUserPayouts } from '../controllers/payout.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.get('/payouts', protect, getUserPayouts);

export default router;


