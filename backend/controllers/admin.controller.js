import User from '../models/User.js';
import Property from '../models/Property.js';
import Withdrawal from '../models/Withdrawal.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user detail
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user holdings
    const holdings = await Holding.find({ userId: user._id })
      .populate('propertyId', 'title');

    // Get user transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        user,
        holdings,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body; // active, locked, suspended

    if (!['active', 'locked', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, locked, suspended',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.accountStatus = status;
    await user.save();

    console.log('✅ Admin - User status updated:', {
      userId: user._id,
      email: user.email,
      oldStatus: user.accountStatus,
      newStatus: status,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('❌ Admin - Error updating user status:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Credit user wallet
// @route   POST /api/admin/users/:id/wallet/credit
// @access  Private/Admin
export const creditWallet = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.wallet.balance += amount;
    await user.save();

    // Create transaction
    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount,
      description: reason || 'Wallet credited by admin',
      status: 'completed',
    });

    res.json({
      success: true,
      message: 'Wallet credited successfully',
      data: {
        balance: user.wallet.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Debit user wallet
// @route   POST /api/admin/users/:id/wallet/debit
// @access  Private/Admin
export const debitWallet = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (amount > user.wallet.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
      });
    }

    user.wallet.balance -= amount;
    await user.save();

    // Create transaction
    await Transaction.create({
      userId: user._id,
      type: 'debit',
      amount,
      description: reason || 'Wallet debited by admin',
      status: 'completed',
    });

    res.json({
      success: true,
      message: 'Wallet debited successfully',
      data: {
        balance: user.wallet.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user account (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has active holdings (lock-in status)
    const activeHoldings = await Holding.find({
      userId: user._id,
      status: 'lock-in',
    });

    if (activeHoldings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with active investments. User has ${activeHoldings.length} active holding(s).`,
      });
    }

    // Check if user has pending withdrawals
    const pendingWithdrawals = await Withdrawal.find({
      userId: user._id,
      status: 'pending',
    });

    if (pendingWithdrawals.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with pending withdrawals. User has ${pendingWithdrawals.length} pending withdrawal(s).`,
      });
    }

    // Perform soft delete by setting accountStatus to 'deleted'
    user.accountStatus = 'deleted';
    await user.save();

    console.log('✅ Admin - User deleted (soft delete):', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'User account deleted successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error('❌ Admin - Error deleting user:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
export const getWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      count: withdrawals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: withdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve withdrawal
// @route   PUT /api/admin/withdrawals/:id/approve
// @access  Private/Admin
export const approveWithdrawal = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal already processed',
      });
    }

    const user = await User.findById(withdrawal.userId);

    if (withdrawal.type === 'investment') {
      // Deduct from user's locked amount
      user.wallet.lockedAmount -= withdrawal.amount;
      user.wallet.totalInvestments -= withdrawal.amount;
    } else if (withdrawal.type === 'earnings') {
      // Deduct from earnings
      user.wallet.earningsReceived -= withdrawal.amount;
    }

    await user.save();

    withdrawal.status = 'approved';
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    if (adminNotes) withdrawal.adminNotes = adminNotes;
    await withdrawal.save();

    // Create transaction
    await Transaction.create({
      userId: withdrawal.userId,
      type: 'withdrawal',
      amount: withdrawal.amount,
      description: `Withdrawal ${withdrawal.type} - Approved`,
      status: 'completed',
    });

    res.json({
      success: true,
      message: 'Withdrawal approved',
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject withdrawal
// @route   PUT /api/admin/withdrawals/:id/reject
// @access  Private/Admin
export const rejectWithdrawal = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal already processed',
      });
    }

    withdrawal.status = 'rejected';
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    if (adminNotes) withdrawal.adminNotes = adminNotes;
    await withdrawal.save();

    res.json({
      success: true,
      message: 'Withdrawal rejected',
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const totalInvestments = await Holding.countDocuments();
    const totalWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });

    const totalInvestmentAmount = await Holding.aggregate([
      { $group: { _id: null, total: { $sum: '$amountInvested' } } },
    ]);

    const totalPropertiesInvested = await Property.aggregate([
      { $group: { _id: null, total: { $sum: '$totalInvested' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        totalInvestments,
        pendingWithdrawals: totalWithdrawals,
        totalInvestmentAmount: totalInvestmentAmount[0]?.total || 0,
        totalPropertiesInvested: totalPropertiesInvested[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


