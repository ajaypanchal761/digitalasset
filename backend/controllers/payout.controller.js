import Payout from '../models/Payout.js';
import Holding from '../models/Holding.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Transaction from '../models/Transaction.js';
import { calculateMonthlyEarning } from '../utils/calculate.js';

// @desc    Get all payouts
// @route   GET /api/admin/payouts
// @access  Private/Admin
export const getPayouts = async (req, res) => {
  try {
    const { status, userId, holdingId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }
    if (holdingId) {
      query.holdingId = holdingId;
    }

    const payouts = await Payout.find(query)
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested')
      .sort({ payoutDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payout.countDocuments(query);

    // Format response
    const formattedPayouts = payouts.map(payout => ({
      _id: payout._id,
      id: payout._id,
      userName: payout.userId?.name || 'Unknown',
      userEmail: payout.userId?.email || 'N/A',
      propertyName: payout.propertyId?.title || 'N/A',
      amount: payout.amount || 0,
      payoutDate: payout.payoutDate,
      nextPayoutDate: payout.nextPayoutDate,
      status: payout.status || 'pending',
      month: payout.month,
      year: payout.year,
      processedAt: payout.processedAt,
      createdAt: payout.createdAt,
    }));

    res.json({
      success: true,
      count: formattedPayouts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: formattedPayouts || [],
    });
  } catch (error) {
    console.error('Error in getPayouts:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Process payouts
// @route   POST /api/admin/payouts/process
// @access  Private/Admin
export const processPayouts = async (req, res) => {
  try {
    const { payoutIds } = req.body;

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payout IDs are required',
      });
    }

    const processedPayouts = [];
    const failedPayouts = [];

    for (const payoutId of payoutIds) {
      try {
        const payout = await Payout.findById(payoutId)
          .populate('userId')
          .populate('holdingId')
          .populate('propertyId');

        if (!payout) {
          failedPayouts.push({ payoutId, reason: 'Payout not found' });
          continue;
        }

        if (payout.status !== 'pending') {
          failedPayouts.push({ payoutId, reason: `Payout already ${payout.status}` });
          continue;
        }

        const user = await User.findById(payout.userId._id);
        if (!user) {
          failedPayouts.push({ payoutId, reason: 'User not found' });
          continue;
        }

        // Credit user wallet
        user.wallet.balance += payout.amount;
        user.wallet.earningsReceived += payout.amount;
        user.wallet.withdrawableBalance += payout.amount;
        await user.save();

        // Update holding
        const holding = await Holding.findById(payout.holdingId._id);
        if (holding) {
          holding.totalEarningsReceived += payout.amount;
          holding.lastPayoutDate = payout.payoutDate;
          holding.payoutCount += 1;
          
          // Calculate next payout date (1st of next month)
          const nextPayout = new Date(payout.nextPayoutDate);
          nextPayout.setMonth(nextPayout.getMonth() + 1);
          nextPayout.setDate(1);
          holding.nextPayoutDate = nextPayout;
          
          await holding.save();
        }

        // Update payout status
        payout.status = 'processed';
        payout.processedAt = new Date();
        payout.processedBy = req.user.id;
        await payout.save();

        // Create transaction record
        await Transaction.create({
          userId: user._id,
          type: 'earning',
          amount: payout.amount,
          description: `Monthly payout from ${payout.propertyId?.title || 'Property'}`,
          status: 'completed',
          holdingId: holding?._id,
          propertyId: payout.propertyId?._id,
        });

        processedPayouts.push(payoutId);
      } catch (error) {
        console.error(`Error processing payout ${payoutId}:`, error);
        failedPayouts.push({ payoutId, reason: error.message });

        // Mark payout as failed
        await Payout.findByIdAndUpdate(payoutId, {
          status: 'failed',
          failureReason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${processedPayouts.length} payout(s), ${failedPayouts.length} failed`,
      data: {
        processed: processedPayouts,
        failed: failedPayouts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get payout history
// @route   GET /api/admin/payouts/history
// @access  Private/Admin
export const getPayoutHistory = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 50 } = req.query;

    const query = { status: { $in: ['processed', 'completed'] } };
    
    if (startDate || endDate) {
      query.payoutDate = {};
      if (startDate) query.payoutDate.$gte = new Date(startDate);
      if (endDate) query.payoutDate.$lte = new Date(endDate);
    }
    
    if (userId) {
      query.userId = userId;
    }

    const payouts = await Payout.find(query)
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .sort({ payoutDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payout.countDocuments(query);

    res.json({
      success: true,
      count: payouts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: payouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user payouts
// @route   GET /api/payouts
// @access  Private
export const getUserPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ userId: req.user.id })
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested')
      .sort({ payoutDate: -1 });

    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create monthly payouts for all active holdings (Cron job function)
// @route   POST /api/admin/payouts/generate
// @access  Private/Admin
export const generateMonthlyPayouts = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Find all active holdings that need payouts
    const holdings = await Holding.find({
      status: 'lock-in',
      $or: [
        { nextPayoutDate: { $lte: today } },
        { nextPayoutDate: { $exists: false } },
      ],
    })
      .populate('propertyId')
      .populate('userId');

    const createdPayouts = [];
    const errors = [];

    for (const holding of holdings) {
      try {
        // Check if payout already exists for this month
        const existingPayout = await Payout.findOne({
          holdingId: holding._id,
          month: currentMonth,
          year: currentYear,
        });

        if (existingPayout) {
          continue; // Skip if already created
        }

        // Calculate next payout date
        const payoutDate = new Date();
        payoutDate.setDate(1); // 1st of current month
        
        const nextPayoutDate = new Date(payoutDate);
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);

        // Create payout
        const payout = await Payout.create({
          userId: holding.userId,
          holdingId: holding._id,
          propertyId: holding.propertyId._id,
          amount: holding.monthlyEarning,
          payoutDate: payoutDate,
          nextPayoutDate: nextPayoutDate,
          status: 'pending',
          month: currentMonth,
          year: currentYear,
        });

        // Update holding's next payout date
        holding.nextPayoutDate = nextPayoutDate;
        if (!holding.lastPayoutDate) {
          holding.lastPayoutDate = payoutDate;
        }
        await holding.save();

        createdPayouts.push(payout._id);
      } catch (error) {
        console.error(`Error creating payout for holding ${holding._id}:`, error);
        errors.push({ holdingId: holding._id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Generated ${createdPayouts.length} payout(s)`,
      data: {
        created: createdPayouts.length,
        errors: errors.length,
        payoutIds: createdPayouts,
        errors: errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

