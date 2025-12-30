import OfflineBuyerRequest from '../models/OfflineBuyerRequest.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Holding from '../models/Holding.js';
import { sendOfflineBuyerEmail } from '../utils/email.js';

// @desc    Create offline buyer request and send email
// @route   POST /api/offline-buyer-requests
// @access  Private
export const createOfflineBuyerRequest = async (req, res) => {
  try {
    const { holdingId, buyerName, buyerEmail, buyerPhone } = req.body;

    // Validate required fields
    if (!holdingId || !buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Holding ID, buyer name, email, and phone are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(buyerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits',
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

    // Check if there's already a pending request for this holding
    const existingRequest = await OfflineBuyerRequest.findOne({
      holdingId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending offline buyer request for this holding',
      });
    }

    // Get seller info
    const seller = await User.findById(req.user.id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Create offline buyer request
    const offlineBuyerRequest = await OfflineBuyerRequest.create({
      sellerId: req.user.id,
      propertyId: holding.propertyId._id || holding.propertyId,
      holdingId,
      buyerEmail: buyerEmail.toLowerCase().trim(),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      salePrice: holding.amountInvested, // Default to investment amount, can be updated
      status: 'pending',
    });

    // Send email to offline buyer
    try {
      const emailResult = await sendOfflineBuyerEmail({
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName: buyerName.trim(),
        sellerName: seller.name,
        sellerEmail: seller.email,
        propertyTitle: holding.propertyId.title || 'Property',
        investmentAmount: holding.amountInvested,
      });

      if (!emailResult.success) {
        console.error('Failed to send email to offline buyer:', emailResult.error);
        // Don't fail the request if email fails, but log it
      }
    } catch (emailError) {
      console.error('Error sending email to offline buyer:', emailError);
      // Continue even if email fails
    }

    // Populate and return
    const populatedRequest = await OfflineBuyerRequest.findById(offlineBuyerRequest._id)
      .populate('sellerId', 'name email phone')
      .populate('propertyId', 'title')
      .populate('holdingId', 'amountInvested purchaseDate');

    res.status(201).json({
      success: true,
      message: 'Offline buyer request created and email sent successfully',
      data: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create offline buyer request',
    });
  }
};

// @desc    Get offline buyer requests for seller
// @route   GET /api/offline-buyer-requests
// @access  Private
export const getOfflineBuyerRequests = async (req, res) => {
  try {
    const requests = await OfflineBuyerRequest.find({
      sellerId: req.user.id,
    })
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
      message: error.message || 'Failed to fetch offline buyer requests',
    });
  }
};

