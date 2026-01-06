import Holding from '../models/Holding.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
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

    // Payment gateway integration removed
    // Return order details for manual payment processing
    res.json({
      success: true,
      message: 'Payment gateway integration removed. Please implement your preferred payment gateway.',
      data: {
        propertyId,
        amountInvested,
        currency: 'INR',
        timePeriod: timePeriod || property.lockInMonths,
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
    const { paymentId, propertyId, amountInvested, timePeriod } = req.body;

    // Payment gateway integration removed
    // Implement your payment verification logic here
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
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
    const monthlyEarning = calculateMonthlyEarning(amountInvested, new Date()); // Year 1 calculation
    const lockInMonths = timePeriod || property.lockInMonths;
    const purchaseDate = new Date();
    const maturityDate = calculateMaturityDate(purchaseDate, lockInMonths);
    
    // Calculate next payout date (1st of the month, 3 months after purchase due to lock-in period)
    const nextPayoutDate = new Date(purchaseDate);
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 3);
    nextPayoutDate.setDate(1);

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
      nextPayoutDate: nextPayoutDate,
      payoutCount: 0,
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
      paymentId: paymentId,
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
    // Payment gateway webhook handler
    // Implement your payment gateway webhook logic here
    const event = req.body;

    // Process webhook event based on your payment gateway

    res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

