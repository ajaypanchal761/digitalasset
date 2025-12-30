import PropertyTransferRequest from '../models/PropertyTransferRequest.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Holding from '../models/Holding.js';


// @desc    Check if holding is eligible for withdrawal (3 months passed)
// @route   GET /api/withdrawals/eligible/:holdingId
// @access  Private
export const checkWithdrawalEligibility = async (req, res) => {
  try {
    const { holdingId } = req.params;

    const holding = await Holding.findById(holdingId);
    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    // Check if holding belongs to user
    if (holding.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this holding',
      });
    }

    // Check if 3 months (90 days) have passed
    const purchaseDate = new Date(holding.purchaseDate);
    const today = new Date();
    const daysSincePurchase = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    const isEligible = daysSincePurchase >= 90;

    res.json({
      success: true,
      data: {
        isEligible,
        daysSincePurchase,
        purchaseDate: holding.purchaseDate,
        daysRemaining: isEligible ? 0 : 90 - daysSincePurchase,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check withdrawal eligibility',
    });
  }
};

// @desc    Create property transfer request
// @route   POST /api/transfer-requests
// @access  Private
export const createTransferRequest = async (req, res) => {
  try {
    const { buyerId, holdingId, salePrice } = req.body;

    // Validate required fields
    if (!buyerId || !holdingId || !salePrice) {
      return res.status(400).json({
        success: false,
        message: 'Buyer ID, holding ID, and sale price are required',
      });
    }

    // Validate holding exists and belongs to seller
    const holding = await Holding.findById(holdingId).populate('propertyId');
    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    if (holding.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to transfer this holding',
      });
    }

    // Check if 3 months have passed
    const purchaseDate = new Date(holding.purchaseDate);
    const today = new Date();
    const daysSincePurchase = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
    if (daysSincePurchase < 90) {
      return res.status(400).json({
        success: false,
        message: 'Holding must be at least 3 months old to initiate transfer',
      });
    }

    // Validate buyer exists
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found',
      });
    }

    if (buyerId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send transfer request to yourself',
      });
    }

    // Validate sale price (minimum 80% of investment)
    const minSalePrice = holding.amountInvested * 0.8;
    if (salePrice < minSalePrice) {
      return res.status(400).json({
        success: false,
        message: `Minimum sale price is ₹${minSalePrice.toLocaleString('en-IN')} (80% of investment)`,
      });
    }

    // Check if there's already a pending request for this holding
    const existingRequest = await PropertyTransferRequest.findOne({
      holdingId,
      status: { $in: ['pending', 'accepted', 'admin_pending'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending transfer request for this holding',
      });
    }

    // Create transfer request
    const transferRequest = await PropertyTransferRequest.create({
      sellerId: req.user.id,
      buyerId,
      propertyId: holding.propertyId._id || holding.propertyId,
      holdingId,
      salePrice,
      status: 'pending',
      buyerResponse: 'pending',
    });

    // Populate and return
    const populatedRequest = await PropertyTransferRequest.findById(transferRequest._id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    // Emit notification to buyer via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        io.to(buyerId.toString()).emit('notification', {
          type: 'transfer-request',
          title: 'New Property Transfer Request',
          message: `${req.user.name} wants to sell you a property holding`,
          transferRequestId: transferRequest._id.toString(),
        });
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
    }

    res.status(201).json({
      success: true,
      message: 'Transfer request sent successfully',
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transfer request',
    });
  }
};

// @desc    Get received transfer requests (for buyer)
// @route   GET /api/transfer-requests/received
// @access  Private
export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await PropertyTransferRequest.find({
      buyerId: req.user.id,
      status: { $in: ['pending', 'accepted', 'admin_pending'] },
    })
      .populate('sellerId', 'name email phone avatarUrl')
      .populate('propertyId', 'title description imageUrl')
      .populate('holdingId', 'amountInvested purchaseDate monthlyEarning')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch received requests',
    });
  }
};

// @desc    Get sent transfer requests (for seller)
// @route   GET /api/transfer-requests/sent
// @access  Private
export const getSentRequests = async (req, res) => {
  try {
    const requests = await PropertyTransferRequest.find({
      sellerId: req.user.id,
    })
      .populate('buyerId', 'name email phone avatarUrl')
      .populate('propertyId', 'title description imageUrl')
      .populate('holdingId', 'amountInvested purchaseDate monthlyEarning')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch sent requests',
    });
  }
};

// @desc    Buyer responds to transfer request (accept/decline)
// @route   PUT /api/transfer-requests/:id/respond
// @access  Private
export const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // 'accepted' or 'declined'

    if (!response || !['accepted', 'declined'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Response must be either "accepted" or "declined"',
      });
    }

    const transferRequest = await PropertyTransferRequest.findById(id);
    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Check if user is the buyer
    if (transferRequest.buyerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request',
      });
    }

    // Check if request is still pending
    if (transferRequest.buyerResponse !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been responded to',
      });
    }

    // Update request
    transferRequest.buyerResponse = response;
    transferRequest.buyerResponseDate = new Date();
    
    if (response === 'accepted') {
      transferRequest.status = 'accepted';
    } else {
      transferRequest.status = 'rejected';
    }

    await transferRequest.save();

    // Populate and return
    const populatedRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    // Emit notification to seller via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        io.to(transferRequest.sellerId.toString()).emit('notification', {
          type: 'transfer-response',
          title: `Transfer Request ${response === 'accepted' ? 'Accepted' : 'Declined'}`,
          message: `${req.user.name} has ${response === 'accepted' ? 'accepted' : 'declined'} your transfer request`,
          transferRequestId: transferRequest._id.toString(),
        });
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
    }

    res.json({
      success: true,
      message: `Transfer request ${response === 'accepted' ? 'accepted' : 'declined'} successfully`,
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to transfer request',
    });
  }
};

// @desc    Seller initiates transfer (moves to admin approval)
// @route   POST /api/transfer-requests/:id/initiate-transfer
// @access  Private
export const initiateTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transferRequest = await PropertyTransferRequest.findById(id);
    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Check if user is the seller
    if (transferRequest.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to initiate this transfer',
      });
    }

    // Check if buyer has accepted
    if (transferRequest.buyerResponse !== 'accepted' || transferRequest.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Buyer must accept the request before initiating transfer',
      });
    }

    // Check if already initiated
    if (transferRequest.status === 'admin_pending' || transferRequest.status === 'admin_approved' || transferRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Transfer has already been initiated',
      });
    }

    // Move to admin approval
    transferRequest.status = 'admin_pending';
    await transferRequest.save();

    // Populate and return
    const populatedRequest = await PropertyTransferRequest.findById(id)
      .populate('sellerId', 'name email phone')
      .populate('buyerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    // Emit notification to all admins via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        io.emit('admin-notification', {
          type: 'transfer-request',
          title: 'New Transfer Request for Approval',
          message: `${req.user.name} wants to transfer property to ${populatedRequest.buyerId.name}`,
          transferRequestId: transferRequest._id.toString(),
        });
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
    }

    res.json({
      success: true,
      message: 'Transfer request sent to admin for approval',
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate transfer',
    });
  }
};

// @desc    Cancel transfer request
// @route   PUT /api/transfer-requests/:id/cancel
// @access  Private
export const cancelTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const transferRequest = await PropertyTransferRequest.findById(id);
    if (!transferRequest) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found',
      });
    }

    // Check if user is the seller
    if (transferRequest.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request',
      });
    }

    // Check if can be cancelled
    if (['cancelled', 'completed', 'admin_approved'].includes(transferRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this request',
      });
    }

    transferRequest.status = 'cancelled';
    await transferRequest.save();

    res.json({
      success: true,
      message: 'Transfer request cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel transfer request',
    });
  }
};

