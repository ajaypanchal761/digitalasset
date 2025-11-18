import razorpay from '../config/razorpay.js';
import crypto from 'crypto';

/**
 * Create Razorpay order
 * @param {number} amount - Amount in rupees
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes
 * @returns {Promise<object>} Razorpay order
 */
export const createRazorpayOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes,
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify Razorpay payment
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 * @param {string} secret - Razorpay secret key
 * @returns {boolean} True if payment is verified
 */
export const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature, secret) => {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};


