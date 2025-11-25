import express from 'express';
import {
  createWithdrawal,
  getWithdrawals,
  getWithdrawal,
} from '../controllers/withdrawal.controller.js';
import { checkWithdrawalEligibility } from '../controllers/transferRequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/eligible/:holdingId', protect, checkWithdrawalEligibility);
router.post('/', protect, createWithdrawal);
router.get('/', protect, getWithdrawals);
router.get('/:id', protect, getWithdrawal);

export default router;


