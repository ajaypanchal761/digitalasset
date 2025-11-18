import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Holding from '../models/Holding.js';

// @desc    Get wallet balance
// @route   GET /api/wallet
// @access  Private
export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Calculate withdrawable balance from matured holdings
    const holdings = await Holding.find({ userId: req.user.id });
    const maturedHoldings = holdings.filter(h => {
      const maturityDate = new Date(h.maturityDate);
      return maturityDate <= new Date();
    });

    const withdrawableBalance = maturedHoldings.reduce((sum, h) => sum + h.amountInvested, 0);

    // Update user wallet
    user.wallet.withdrawableBalance = withdrawableBalance;
    await user.save();

    res.json({
      success: true,
      data: {
        currency: 'INR',
        balance: user.wallet.balance,
        totalInvestments: user.wallet.totalInvestments,
        earningsReceived: user.wallet.earningsReceived,
        withdrawableBalance: user.wallet.withdrawableBalance,
        lockedAmount: user.wallet.lockedAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get transactions
// @route   GET /api/wallet/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;

    const query = { userId: req.user.id };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('propertyId', 'title')
      .populate('holdingId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


