import express from 'express';
import {
  createOrder,
  verifyPayment,
  paymentWebhook,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', paymentWebhook); // Public for Razorpay webhook

export default router;


