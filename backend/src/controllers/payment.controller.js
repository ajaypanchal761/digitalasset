import Holding from '../models/Holding.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { createRazorpayOrder, verifyPayment as verifyPaymentSignature } from '../utils/payment.js';
import { calculateMonthlyEarning, calculateMaturityDate } from '../utils/calculate.js';

// @desc    Create payment order
// @route   POST /api/payment/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { propertyId, amountInvested, timePeriod } = req.body;

    // Validate property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Validate amount
    if (amountInvested < property.minInvestment) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment is ₹${property.minInvestment.toLocaleString('en-IN')}`,
      });
    }

    // Get user
    const user = await User.findById(req.user.id);

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(
      amountInvested,
      'INR',
      {
        propertyId: propertyId.toString(),
        userId: req.user.id.toString(),
        timePeriod: timePeriod || property.lockInMonths,
      }
    );

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }

    res.json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, propertyId, amountInvested, timePeriod } = req.body;

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Get property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Get user
    const user = await User.findById(req.user.id);

    // Calculate values
    const monthlyEarning = calculateMonthlyEarning(amountInvested, property.monthlyReturnRate);
    const lockInMonths = timePeriod || property.lockInMonths;
    const purchaseDate = new Date();
    const maturityDate = calculateMaturityDate(purchaseDate, lockInMonths);

    // Create holding
    const holding = await Holding.create({
      userId: req.user.id,
      propertyId,
      amountInvested,
      purchaseDate,
      maturityDate,
      monthlyEarning,
      lockInMonths,
      status: 'lock-in',
      canWithdrawInvestment: false,
      canWithdrawEarnings: true,
    });

    // Update property
    property.totalInvested += amountInvested;
    property.availableToInvest -= amountInvested;
    property.investorCount += 1;
    await property.save();

    // Update user wallet
    user.wallet.totalInvestments += amountInvested;
    user.wallet.lockedAmount += amountInvested;
    await user.save();

    // Create transaction
    await Transaction.create({
      userId: req.user.id,
      type: 'investment',
      amount: amountInvested,
      description: `Investment in ${property.title}`,
      status: 'completed',
      holdingId: holding._id,
      propertyId: property._id,
      paymentId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: 'Payment verified and investment created',
      data: holding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Payment webhook
// @route   POST /api/payment/webhook
// @access  Public
export const paymentWebhook = async (req, res) => {
  try {
    // Handle Razorpay webhook events
    // This is called by Razorpay when payment status changes
    const event = req.body;

    // Verify webhook signature
    // Process webhook event

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

