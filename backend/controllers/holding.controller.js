import Holding from '../models/Holding.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { calculateMonthlyEarning, calculateMaturityDate, isMatured } from '../utils/calculate.js';

// @desc    Get user holdings
// @route   GET /api/holdings
// @access  Private
export const getHoldings = async (req, res) => {
  try {
    // Check for offline buyer requests when user logs in and KYC is approved
    // This ensures we catch any transfers that might have been missed
    try {
      const user = await User.findById(req.user.id);
      if (user && user.kycStatus === 'approved') {
        const { processOfflineBuyerRequests } = await import('../services/kycApprovalService.js');
        await processOfflineBuyerRequests(user._id, user.email);
      }
    } catch (error) {
      console.error('Error processing offline buyer requests on holdings fetch:', error);
      // Continue even if this fails
    }

    const holdings = await Holding.find({ userId: req.user.id })
      .populate('propertyId', 'title description image')
      .sort({ purchaseDate: -1 });

    // Update status and calculate days remaining
    const updatedHoldings = holdings.map(holding => {
      const matured = isMatured(holding.maturityDate);
      return {
        ...holding.toObject(),
        status: matured ? 'matured' : 'lock-in',
        canWithdrawInvestment: matured,
        daysRemaining: matured ? 0 : Math.ceil((holding.maturityDate - new Date()) / (1000 * 60 * 60 * 24)),
      };
    });

    res.json({
      success: true,
      count: updatedHoldings.length,
      data: updatedHoldings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single holding
// @route   GET /api/holdings/:id
// @access  Private
export const getHolding = async (req, res) => {
  try {
    const holding = await Holding.findById(req.params.id)
      .populate('propertyId')
      .populate('userId', 'name email');

    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    // Check if user owns this holding
    if (holding.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this holding',
      });
    }

    const matured = isMatured(holding.maturityDate);
    const holdingData = {
      ...holding.toObject(),
      status: matured ? 'matured' : 'lock-in',
      canWithdrawInvestment: matured,
      daysRemaining: matured ? 0 : Math.ceil((holding.maturityDate - new Date()) / (1000 * 60 * 60 * 24)),
    };

    res.json({
      success: true,
      data: holdingData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create investment (holding)
// @route   POST /api/holdings
// @access  Private
export const createHolding = async (req, res) => {
  try {
    const { propertyId, amountInvested, timePeriod } = req.body;

    // Validate property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check minimum investment
    if (amountInvested < property.minInvestment) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment is ₹${property.minInvestment.toLocaleString('en-IN')}`,
      });
    }

    // Check if property has available investment
    if (amountInvested > property.availableToInvest) {
      return res.status(400).json({
        success: false,
        message: 'Investment amount exceeds available limit',
      });
    }

    // Get user
    const user = await User.findById(req.user.id);

    // Check if user has sufficient balance
    if (amountInvested > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
      });
    }

    // Calculate values
    const monthlyEarning = calculateMonthlyEarning(amountInvested, property.monthlyReturnRate);
    const lockInMonths = timePeriod || property.lockInMonths;
    const purchaseDate = new Date();
    const maturityDate = calculateMaturityDate(purchaseDate, lockInMonths);
    
    // Calculate next payout date (1st of next month)
    const nextPayoutDate = new Date(purchaseDate);
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
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
    user.wallet.balance -= amountInvested;
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
    });

    res.status(201).json({
      success: true,
      data: holding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


