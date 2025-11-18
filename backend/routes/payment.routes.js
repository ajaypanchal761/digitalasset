import express from 'express';
import {
  createOrder,
  verifyPayment,
  paymentWebhook,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { paymentLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply rate limiting to payment routes (except webhook)
router.post('/create-order', paymentLimiter, protect, createOrder);
router.post('/verify', paymentLimiter, protect, verifyPayment);
router.post('/webhook', paymentWebhook); // Public for payment gateway webhook (no rate limit)

export default router;


