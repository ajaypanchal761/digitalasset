import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';
import { isMatured } from '../utils/calculate.js';

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private
export const createWithdrawal = async (req, res) => {
  try {
    const { amount, type, bankDetails } = req.body;

    const user = await User.findById(req.user.id).select('name email wallet');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (type === 'investment') {
      // Check if user has matured investments
      const holdings = await Holding.find({ userId: req.user.id });
      const maturedHoldings = holdings.filter(h => isMatured(h.maturityDate));

      const totalMaturedAmount = maturedHoldings.reduce((sum, h) => sum + h.amountInvested, 0);

      if (amount > totalMaturedAmount) {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal amount exceeds matured investment amount',
        });
      }
    } else if (type === 'earnings') {
      // Check if user has earnings
      if (amount > user.wallet.earningsReceived) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient earnings balance',
        });
      }
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      amount,
      type,
      bankDetails,
      status: 'pending',
    });

    // Emit notification to all admins via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        const notification = {
          type: 'withdrawal-request',
          title: 'Withdrawal request pending',
          message: `${user.name} requested withdrawal of ₹${amount.toLocaleString('en-IN')} (${type === 'investment' ? 'Investment' : 'Earnings'})`,
          userInfo: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
          withdrawalInfo: {
            id: withdrawal._id.toString(),
            amount,
            type,
            status: withdrawal.status,
          },
          timestamp: new Date().toISOString(),
          icon: '💰',
          link: `/admin/withdrawals`,
        };
        
        io.to('admin-room').emit('new-withdrawal-request', notification);
        console.log('📢 Notification sent to admins: New withdrawal request');
      }
    } catch (error) {
      console.error('❌ Error emitting withdrawal notification:', error);
      // Don't fail the withdrawal creation if notification fails
    }

    res.status(201).json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user withdrawals
// @route   GET /api/withdrawals
// @access  Private
export const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: withdrawals.length,
      data: withdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single withdrawal
// @route   GET /api/withdrawals/:id
// @access  Private
export const getWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    // Check if user owns this withdrawal
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


