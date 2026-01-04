import User from '../models/User.js';
import Property from '../models/Property.js';
import Withdrawal from '../models/Withdrawal.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';
import PropertyTransferRequest from '../models/PropertyTransferRequest.js';
import { calculateMonthlyEarning, calculateMaturityDate, calculateNextPayoutDate } from '../utils/calculate.js';

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

    if (status && status !== 'all') {
      query.accountStatus = status;
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
    const { status, search, page = 1, limit = 20 } = req.query;

    // Build match query for aggregation
    const matchQuery = {};
    if (status && status !== 'all') {
      // Map frontend status to backend status
      if (status === 'completed') {
        matchQuery.status = { $in: ['approved', 'processed'] };
      } else {
        matchQuery.status = status;
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      // Match withdrawals by status
      { $match: Object.keys(matchQuery).length > 0 ? matchQuery : {} },
      // Lookup user information
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      pipeline.push({
        $match: {
          $or: [
            { 'userInfo.name': searchRegex },
            { 'userInfo.email': searchRegex },
            { 'userInfo.phone': searchRegex },
            { 'bankDetails.accountNumber': searchRegex },
            { 'bankDetails.ifscCode': searchRegex },
            { 'bankDetails.accountHolderName': searchRegex },
            { _id: { $regex: search.trim(), $options: 'i' } }
          ]
        }
      });
    }

    // Add sorting, skip, and limit
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    // Project fields to match expected structure
    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        amount: 1,
        type: 1,
        bankDetails: 1,
        status: 1,
        adminNotes: 1,
        processedBy: 1,
        processedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        'userId': {
          _id: '$userInfo._id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          phone: '$userInfo.phone'
        }
      }
    });

    // Execute aggregation for data
    const withdrawals = await Withdrawal.aggregate(pipeline);

    // Get total count with same filters
    const countPipeline = [
      { $match: Object.keys(matchQuery).length > 0 ? matchQuery : {} },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      countPipeline.push({
        $match: {
          $or: [
            { 'userInfo.name': searchRegex },
            { 'userInfo.email': searchRegex },
            { 'userInfo.phone': searchRegex },
            { 'bankDetails.accountNumber': searchRegex },
            { 'bankDetails.ifscCode': searchRegex },
            { 'bankDetails.accountHolderName': searchRegex },
            { _id: { $regex: search.trim(), $options: 'i' } }
          ]
        }
      });
    }

    countPipeline.push({ $count: 'total' });
    const countResult = await Withdrawal.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

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
      // Deduct from user's locked amount and total investments
      user.wallet.lockedAmount -= withdrawal.amount;
      user.wallet.totalInvestments -= withdrawal.amount;
      // Deduct from balance (principal is being withdrawn)
      user.wallet.balance -= withdrawal.amount;
    } else if (withdrawal.type === 'earnings') {
      // Deduct from earnings and balance
      user.wallet.earningsReceived -= withdrawal.amount;
      user.wallet.balance -= withdrawal.amount;
    }

    // Recalculate withdrawable balance (matured investments + earnings)
    // This ensures consistency after any withdrawal
    const holdings = await Holding.find({ userId: withdrawal.userId });
    const maturedHoldings = holdings.filter(h => {
      const maturityDate = new Date(h.maturityDate);
      return maturityDate <= new Date();
    });
    const maturedInvestmentAmount = maturedHoldings.reduce((sum, h) => sum + h.amountInvested, 0);
    user.wallet.withdrawableBalance = maturedInvestmentAmount + (user.wallet.earningsReceived || 0);

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

// @desc    Get all transfer requests
// @route   GET /api/admin/transfer-requests
// @access  Private/Admin
export const getTransferRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await PropertyTransferRequest.find(query)
      .populate('sellerId', 'name email phone kycStatus')
      .populate('buyerId', 'name email phone kycStatus')
      .populate('propertyId', 'title description imageUrl')
      .populate('holdingId', 'amountInvested purchaseDate monthlyEarning')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await PropertyTransferRequest.countDocuments(query);

    res.json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch transfer requests',
    });
  }
};

// @desc    Approve transfer request
// @route   PUT /api/admin/transfer-requests/:id/approve
// @access  Private/Admin
export const approveTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const transferRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone wallet')
      .populate('buyerId', 'name email phone wallet')
      .populate('holdingId')
      .populate('propertyId', 'title monthlyReturnRate');

    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    if (transferRequest.status !== 'admin_pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer request is not pending admin approval',
      });
    }

    // Validate buyer has sufficient balance
    const buyer = await User.findById(transferRequest.buyerId._id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found',
      });
    }

    const buyerBalance = buyer.wallet?.balance || 0;
    if (buyerBalance < transferRequest.salePrice) {
      return res.status(400).json({
        success: false,
        message: `Buyer has insufficient balance. Required: ₹${transferRequest.salePrice.toLocaleString('en-IN')}, Available: ₹${buyerBalance.toLocaleString('en-IN')}`,
      });
    }

    // Get property to access monthlyReturnRate
    const property = await Property.findById(transferRequest.propertyId._id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Update transfer request status
    transferRequest.status = 'admin_approved';
    transferRequest.adminNotes = adminNotes || '';
    transferRequest.adminResponseDate = new Date();
    await transferRequest.save();

    // Transfer holding ownership and reset with new 3-month lock period
    const holding = await Holding.findById(transferRequest.holdingId);
    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    // Save original investment amount before updating
    const originalInvestmentAmount = holding.amountInvested;

    // Calculate new dates and values for buyer
    const transferDate = new Date();
    const newPurchaseDate = transferDate;
    // Preserve the original lock period from seller's holding
    const originalLockMonths = holding.lockInMonths || 3;
    const newMaturityDate = calculateMaturityDate(newPurchaseDate, originalLockMonths);
    const newNextPayoutDate = calculateNextPayoutDate(newPurchaseDate);

    // Calculate monthly earning based on sale price (not original investment)
    const monthlyReturnRate = property.monthlyReturnRate || 0.5;
    const newMonthlyEarning = calculateMonthlyEarning(transferRequest.salePrice, monthlyReturnRate);

    // Update holding with new owner and preserve original lock period
    const oldUserId = holding.userId;
    holding.userId = transferRequest.buyerId._id;
    holding.purchaseDate = newPurchaseDate;
    holding.maturityDate = newMaturityDate;
    holding.status = 'lock-in';
    holding.canWithdrawInvestment = false;
    holding.lockInMonths = originalLockMonths; // Preserve original lock period
    holding.totalEarningsReceived = 0;
    holding.payoutCount = 0;
    holding.nextPayoutDate = newNextPayoutDate;
    holding.lastPayoutDate = null;
    holding.monthlyEarning = newMonthlyEarning;
    holding.amountInvested = transferRequest.salePrice; // Update to sale price
    await holding.save();

    // Credit seller's wallet with sale price
    const seller = await User.findById(transferRequest.sellerId._id);
    if (seller) {
      seller.wallet.balance = (seller.wallet.balance || 0) + transferRequest.salePrice;
      // Update seller's locked amount (reduce by original investment)
      seller.wallet.lockedAmount = Math.max(0, (seller.wallet.lockedAmount || 0) - originalInvestmentAmount);
      await seller.save();

      // Create transaction record for seller
      await Transaction.create({
        userId: seller._id,
        type: 'credit',
        amount: transferRequest.salePrice,
        description: `Property sale: ${transferRequest.propertyId.title}`,
        status: 'completed',
        reference: `TRANSFER-${transferRequest._id}`,
      });
    }

    // Update buyer's wallet
    buyer.wallet.balance = (buyer.wallet.balance || 0) - transferRequest.salePrice;
    buyer.wallet.lockedAmount = (buyer.wallet.lockedAmount || 0) + transferRequest.salePrice;
    buyer.wallet.totalInvestments = (buyer.wallet.totalInvestments || 0) + transferRequest.salePrice;
    await buyer.save();

    // Create transaction record for buyer (debit)
    await Transaction.create({
      userId: transferRequest.buyerId._id,
      type: 'debit',
      amount: transferRequest.salePrice,
      description: `Property purchase: ${transferRequest.propertyId.title}`,
      status: 'completed',
      reference: `TRANSFER-${transferRequest._id}`,
    });

    // Mark transfer as completed
    transferRequest.status = 'completed';
    transferRequest.transferCompletedDate = new Date();
    await transferRequest.save();

    // Emit notifications via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        // Notify seller
        io.to(transferRequest.sellerId._id.toString()).emit('notification', {
          type: 'transfer-approved',
          title: 'Transfer Request Approved',
          message: `Your property transfer to ${transferRequest.buyerId.name} has been approved`,
          transferRequestId: transferRequest._id.toString(),
        });

        // Notify buyer with detailed information
        const maturityDateFormatted = newMaturityDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const purchaseDateFormatted = newPurchaseDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        
        io.to(transferRequest.buyerId._id.toString()).emit('notification', {
          type: 'transfer-approved',
          title: 'Property Transfer Approved',
          message: `You are now the owner of ${transferRequest.propertyId.title}. Purchase date: ${purchaseDateFormatted}, Maturity date: ${maturityDateFormatted}, Monthly earning: ₹${newMonthlyEarning.toLocaleString('en-IN')}`,
          transferRequestId: transferRequest._id.toString(),
          holdingId: holding._id.toString(),
          purchaseDate: newPurchaseDate,
          maturityDate: newMaturityDate,
          monthlyEarning: newMonthlyEarning,
          lockInMonths: originalLockMonths,
        });
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
    }

    const populatedRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    res.json({
      success: true,
      message: 'Transfer request approved and ownership transferred successfully',
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve transfer request',
    });
  }
};

// @desc    Reject transfer request
// @route   PUT /api/admin/transfer-requests/:id/reject
// @access  Private/Admin
export const rejectTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const transferRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title');

    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    if (transferRequest.status !== 'admin_pending') {
      return res.status(400).json({
        success: false,
        message: 'Transfer request is not pending admin approval',
      });
    }

    // Update transfer request status
    transferRequest.status = 'admin_rejected';
    transferRequest.adminNotes = adminNotes || '';
    transferRequest.adminResponseDate = new Date();
    await transferRequest.save();

    // Emit notifications via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        // Notify seller
        io.to(transferRequest.sellerId._id.toString()).emit('notification', {
          type: 'transfer-rejected',
          title: 'Transfer Request Rejected',
          message: `Your property transfer request has been rejected by admin`,
          transferRequestId: transferRequest._id.toString(),
        });

        // Notify buyer
        io.to(transferRequest.buyerId._id.toString()).emit('notification', {
          type: 'transfer-rejected',
          title: 'Transfer Request Rejected',
          message: `The property transfer request has been rejected by admin`,
          transferRequestId: transferRequest._id.toString(),
        });
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
    }

    const populatedRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    res.json({
      success: true,
      message: 'Transfer request rejected successfully',
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject transfer request',
    });
  }
};

// @desc    Get property investors (holdings for a property)
// @route   GET /api/admin/properties/:id/investors
// @access  Private/Admin
export const getPropertyInvestors = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Get all holdings for this property with user details
    const holdings = await Holding.find({ propertyId })
      .populate('userId', 'name email phone')
      .sort({ purchaseDate: -1 });

    // Filter out holdings where userId is null (user was deleted but holding still exists)
    const validHoldings = holdings.filter(holding => holding.userId);

    // Format the response
    const investors = validHoldings.map(holding => ({
      id: holding._id,
      userId: holding.userId._id,
      userName: holding.userId.name,
      userEmail: holding.userId.email,
      userPhone: holding.userId.phone,
      amountInvested: holding.amountInvested,
      purchaseDate: holding.purchaseDate,
      maturityDate: holding.maturityDate,
      status: holding.status,
      monthlyEarning: holding.monthlyEarning,
      totalEarningsReceived: holding.totalEarningsReceived || 0,
      lockInMonths: holding.lockInMonths,
      payoutCount: holding.payoutCount || 0,
      lastPayoutDate: holding.lastPayoutDate,
      nextPayoutDate: holding.nextPayoutDate,
    }));

    res.json({
      success: true,
      count: investors.length,
      data: investors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch property investors',
    });
  }
};

