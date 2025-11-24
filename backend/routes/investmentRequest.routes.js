import express from 'express';
import {
  createInvestmentRequest,
  getUserInvestmentRequests,
  getInvestmentRequest,
} from '../controllers/investmentRequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadTransactionProof } from '../middleware/upload.js';

const router = express.Router();

// User routes
router.post('/', protect, uploadTransactionProof, createInvestmentRequest);
router.get('/', protect, getUserInvestmentRequests);
router.get('/:id', protect, getInvestmentRequest);

export default router;

