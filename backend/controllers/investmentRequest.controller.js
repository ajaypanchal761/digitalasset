import InvestmentRequest from '../models/InvestmentRequest.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';
import { calculateMonthlyEarning, calculateMaturityDate } from '../utils/calculate.js';

// @desc    Create investment request
// @route   POST /api/investment-requests
// @access  Private
export const createInvestmentRequest = async (req, res) => {
  try {
    const { propertyId, amountInvested, timePeriod, notes } = req.body;
    const transactionProof = req.file?.path;

    // Validate required fields
    if (!propertyId || !amountInvested || !timePeriod) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, investment amount, and time period are required',
      });
    }

    if (!transactionProof) {
      return res.status(400).json({
        success: false,
        message: 'Transaction proof is required',
      });
    }

    // Get user and check KYC status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'KYC verification must be approved before investing',
      });
    }

    // Validate property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Validate property status - only active properties can accept investments
    if (property.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `This property is ${property.status}. Only active properties are available for investment.`,
      });
    }

    // Validate investment amount
    if (amountInvested < property.minInvestment) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment is ₹${property.minInvestment.toLocaleString('en-IN')}`,
      });
    }

    // Validate time period
    if (timePeriod < 3) {
      return res.status(400).json({
        success: false,
        message: 'Minimum investment period is 3 months',
      });
    }

    // Create investment request
    const investmentRequest = await InvestmentRequest.create({
      userId: req.user.id,
      propertyId,
      amountInvested,
      timePeriod,
      transactionProof,
      notes: notes || '',
      status: 'pending',
    });

    // Emit notification to all admins via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        const notification = {
          type: 'investment-request',
          title: 'New investment request',
          message: `${user.name} requested investment of ₹${amountInvested.toLocaleString('en-IN')} in ${property.title}`,
          userInfo: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
          investmentInfo: {
            id: investmentRequest._id.toString(),
            amount: amountInvested,
            propertyId: property._id.toString(),
            propertyTitle: property.title,
          },
          timestamp: new Date().toISOString(),
          icon: 'investment-request',
          link: '/admin/investment-requests',
        };
        
        io.to('admin-room').emit('new-investment-request', notification);
        console.log('📢 Notification sent to admins: New investment request');
      }
    } catch (error) {
      console.error('❌ Error emitting investment request notification:', error);
      // Don't fail the request creation if notification fails
    }

    // Populate property details for response
    await investmentRequest.populate('propertyId', 'title minInvestment monthlyReturnRate');

    res.status(201).json({
      success: true,
      data: investmentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's investment requests
// @route   GET /api/investment-requests
// @access  Private
export const getUserInvestmentRequests = async (req, res) => {
  try {
    const investmentRequests = await InvestmentRequest.find({ userId: req.user.id })
      .populate('propertyId', 'title minInvestment monthlyReturnRate image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: investmentRequests.length,
      data: investmentRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single investment request
// @route   GET /api/investment-requests/:id
// @access  Private
export const getInvestmentRequest = async (req, res) => {
  try {
    const investmentRequest = await InvestmentRequest.findById(req.params.id)
      .populate('propertyId', 'title minInvestment monthlyReturnRate image description')
      .populate('userId', 'name email');

    if (!investmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Investment request not found',
      });
    }

    // Check if user owns this request
    if (investmentRequest.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: investmentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all investment requests (Admin)
// @route   GET /api/admin/investment-requests
// @access  Private/Admin
export const getAdminInvestmentRequests = async (req, res) => {
  try {
    const { status, propertyId, userId, page = 1, limit = 50 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (propertyId) query.propertyId = propertyId;
    if (userId) query.userId = userId;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const investmentRequests = await InvestmentRequest.find(query)
      .populate('userId', 'name email phone avatarUrl')
      .populate('propertyId', 'title minInvestment monthlyReturnRate image')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InvestmentRequest.countDocuments(query);

    res.json({
      success: true,
      count: investmentRequests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: investmentRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve investment request (Admin)
// @route   PUT /api/admin/investment-requests/:id/approve
// @access  Private/Admin
export const approveInvestmentRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const investmentRequest = await InvestmentRequest.findById(req.params.id)
      .populate('propertyId')
      .populate('userId');

    if (!investmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Investment request not found',
      });
    }

    if (investmentRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Investment request is already ${investmentRequest.status}`,
      });
    }

    const property = investmentRequest.propertyId;
    const user = investmentRequest.userId;

    // Calculate values
    const monthlyEarning = calculateMonthlyEarning(
      investmentRequest.amountInvested,
      property.monthlyReturnRate || 0.5
    );
    const lockInMonths = investmentRequest.timePeriod;
    const purchaseDate = new Date();
    const maturityDate = calculateMaturityDate(purchaseDate, lockInMonths);
    
    // Calculate next payout date (1st of the month, 3 months after purchase due to lock-in period)
    const nextPayoutDate = new Date(purchaseDate);
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 3);
    nextPayoutDate.setDate(1);

    // Create holding
    const holding = await Holding.create({
      userId: user._id,
      propertyId: property._id,
      amountInvested: investmentRequest.amountInvested,
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
    property.totalInvested += investmentRequest.amountInvested;
    property.availableToInvest -= investmentRequest.amountInvested;
    property.investorCount += 1;
    await property.save();

    // Update user wallet
    user.wallet.totalInvestments += investmentRequest.amountInvested;
    user.wallet.lockedAmount += investmentRequest.amountInvested;
    await user.save();

    // Create transaction
    await Transaction.create({
      userId: user._id,
      type: 'investment',
      amount: investmentRequest.amountInvested,
      description: `Investment in ${property.title}`,
      status: 'completed',
      holdingId: holding._id,
      propertyId: property._id,
    });

    // Update investment request
    investmentRequest.status = 'approved';
    investmentRequest.approvedBy = req.user.id;
    investmentRequest.approvedAt = new Date();
    if (adminNotes) {
      investmentRequest.adminNotes = adminNotes;
    }
    await investmentRequest.save();

    // Emit notification to user via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        const notification = {
          type: 'investment-approved',
          title: 'Investment approved',
          message: `Your investment request of ₹${investmentRequest.amountInvested.toLocaleString('en-IN')} in ${property.title} has been approved`,
          investmentInfo: {
            id: investmentRequest._id.toString(),
            holdingId: holding._id.toString(),
            amount: investmentRequest.amountInvested,
            propertyTitle: property.title,
          },
          timestamp: new Date().toISOString(),
          icon: 'investment-approved',
          link: '/wallet',
        };
        
        io.to(`User-${user._id.toString()}`).emit('investment-request-updated', notification);
        console.log('📢 Notification sent to user: Investment approved');
      }
    } catch (error) {
      console.error('❌ Error emitting approval notification:', error);
    }

    res.json({
      success: true,
      message: 'Investment request approved and holding created',
      data: {
        investmentRequest,
        holding,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject investment request (Admin)
// @route   PUT /api/admin/investment-requests/:id/reject
// @access  Private/Admin
export const rejectInvestmentRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;

    if (!adminNotes || adminNotes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Admin notes (rejection reason) is required',
      });
    }

    const investmentRequest = await InvestmentRequest.findById(req.params.id)
      .populate('propertyId')
      .populate('userId');

    if (!investmentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Investment request not found',
      });
    }

    if (investmentRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Investment request is already ${investmentRequest.status}`,
      });
    }

    // Update investment request
    investmentRequest.status = 'rejected';
    investmentRequest.adminNotes = adminNotes;
    investmentRequest.rejectedAt = new Date();
    await investmentRequest.save();

    // Emit notification to user via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        const notification = {
          type: 'investment-rejected',
          title: 'Investment request rejected',
          message: `Your investment request of ₹${investmentRequest.amountInvested.toLocaleString('en-IN')} in ${investmentRequest.propertyId.title} has been rejected`,
          investmentInfo: {
            id: investmentRequest._id.toString(),
            amount: investmentRequest.amountInvested,
            propertyTitle: investmentRequest.propertyId.title,
            rejectionReason: adminNotes,
          },
          timestamp: new Date().toISOString(),
          icon: 'investment-rejected',
          link: '/wallet',
        };
        
        io.to(`User-${investmentRequest.userId._id.toString()}`).emit('investment-request-updated', notification);
        console.log('📢 Notification sent to user: Investment rejected');
      }
    } catch (error) {
      console.error('❌ Error emitting rejection notification:', error);
    }

    res.json({
      success: true,
      message: 'Investment request rejected',
      data: investmentRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

