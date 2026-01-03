import ContactOwnerMessage from '../models/ContactOwnerMessage.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Holding from '../models/Holding.js';
import Admin from '../models/Admin.js';
import { sendContactOwnerEmail } from '../utils/email.js';

// @desc    Create a contact owner message
// @route   POST /api/contact-owner
// @access  Private
export const createContactOwnerMessage = async (req, res) => {
  try {
    const { holdingId, subject, message } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!holdingId || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Holding ID, subject, and message are required',
      });
    }

    // Validate message length
    if (message.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 20 characters',
      });
    }

    // Check if holding exists and belongs to user
    const holding = await Holding.findById(holdingId).populate({
      path: 'propertyId',
      populate: {
        path: 'createdBy',
        select: 'name email'
      }
    });
    if (!holding) {
      return res.status(404).json({
        success: false,
        message: 'Holding not found',
      });
    }

    if (holding.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this holding',
      });
    }

    // Get property ID
    const propertyId = holding.propertyId?._id || holding.propertyId;

    // Create contact message
    const contactMessage = await ContactOwnerMessage.create({
      userId,
      holdingId,
      propertyId,
      subject: subject.trim(),
      message: message.trim(),
      status: 'pending',
    });

    // Populate user and property details
    await contactMessage.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'propertyId', select: 'title propertyType' },
      { path: 'holdingId', select: 'amountInvested status' },
    ]);

    // Send email to admin/property owner
    try {
      console.log('📧 Attempting to send contact owner email...');
      console.log('Property createdBy:', property.createdBy);
      console.log('Owner email:', property.createdBy?.email);

      const emailResult = await sendContactOwnerEmail({
        ownerEmail: property.createdBy?.email || 'admin@digitalassets.com',
        ownerName: property.createdBy?.name || 'Admin',
        userName: contactMessage.userId.name,
        userEmail: contactMessage.userId.email,
        userPhone: contactMessage.userId.phone || 'N/A',
        propertyTitle: contactMessage.propertyId.title,
        investmentAmount: contactMessage.holdingId.amountInvested,
        subject: contactMessage.subject,
        message: contactMessage.message,
      });

      console.log('📧 Email result:', emailResult);

      if (!emailResult.success) {
        console.error('❌ Failed to send contact owner email:', emailResult.error);
        // Don't fail the request if email fails, just log it
      } else {
        console.log('✅ Contact owner email sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending contact owner email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent to the property owner',
      data: contactMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

// @desc    Get user's contact owner messages
// @route   GET /api/contact-owner
// @access  Private
export const getUserContactMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ContactOwnerMessage.find(query)
      .populate('propertyId', 'title propertyType')
      .populate('holdingId', 'amountInvested status')
      .populate('adminResponse.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContactOwnerMessage.countDocuments(query);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages',
    });
  }
};

// @desc    Get single contact message
// @route   GET /api/contact-owner/:id
// @access  Private
export const getContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await ContactOwnerMessage.findById(id)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title propertyType description')
      .populate('holdingId', 'amountInvested status purchaseDate maturityDate')
      .populate('adminResponse.respondedBy', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user owns this message
    if (message.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this message',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch message',
    });
  }
};

// @desc    Get property owner contact info (Admin who created the property)
// @route   GET /api/contact-owner/property/:propertyId/owner-info
// @access  Private
export const getPropertyOwnerInfo = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if user has a holding for this property
    const holding = await Holding.findOne({
      userId,
      propertyId,
    });

    if (!holding) {
      return res.status(403).json({
        success: false,
        message: 'You must have a holding for this property to contact the owner',
      });
    }

    // Get property with admin details
    const property = await Property.findById(propertyId).populate('createdBy', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Return admin (owner) contact info
    const ownerInfo = {
      name: property.createdBy?.name || 'Property Owner',
      email: property.createdBy?.email || 'owner@digitalassets.com',
      phone: property.createdBy?.phone || '+91 98765 43210',
    };

    res.json({
      success: true,
      data: ownerInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch owner information',
    });
  }
};

// ==================== ADMIN ROUTES ====================

// @desc    Get all contact owner messages (Admin)
// @route   GET /api/admin/contact-owner
// @access  Private/Admin
export const getAllContactMessages = async (req, res) => {
  try {
    const { status, propertyId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (propertyId) {
      query.propertyId = propertyId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ContactOwnerMessage.find(query)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title propertyType')
      .populate('holdingId', 'amountInvested status')
      .populate('adminResponse.respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContactOwnerMessage.countDocuments(query);

    // Get status counts
    const statusCounts = await ContactOwnerMessage.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages',
    });
  }
};

// @desc    Get single contact message (Admin)
// @route   GET /api/admin/contact-owner/:id
// @access  Private/Admin
export const getAdminContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactOwnerMessage.findById(id)
      .populate('userId', 'name email phone avatarUrl')
      .populate('propertyId', 'title propertyType description')
      .populate('holdingId', 'amountInvested status purchaseDate maturityDate')
      .populate('adminResponse.respondedBy', 'name email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch message',
    });
  }
};

// @desc    Respond to contact message (Admin)
// @route   PUT /api/admin/contact-owner/:id/respond
// @access  Private/Admin
export const respondToContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status, adminNotes } = req.body;
    const adminId = req.user.id;

    const message = await ContactOwnerMessage.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Update message with response
    message.adminResponse = {
      message: response || message.adminResponse?.message,
      respondedAt: new Date(),
      respondedBy: adminId,
    };

    if (status) {
      message.status = status;
    }

    if (adminNotes) {
      message.adminNotes = adminNotes;
    }

    await message.save();

    // Populate response
    await message.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'propertyId', select: 'title propertyType' },
      { path: 'holdingId', select: 'amountInvested status' },
      { path: 'adminResponse.respondedBy', select: 'name email' },
    ]);

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to respond to message',
    });
  }
};

// @desc    Update message status (Admin)
// @route   PUT /api/admin/contact-owner/:id/status
// @access  Private/Admin
export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const message = await ContactOwnerMessage.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    message.status = status;
    if (adminNotes) {
      message.adminNotes = adminNotes;
    }

    await message.save();

    await message.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'propertyId', select: 'title propertyType' },
      { path: 'holdingId', select: 'amountInvested status' },
    ]);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update status',
    });
  }
};

// @desc    Mark message as read (Admin)
// @route   PUT /api/admin/contact-owner/:id/read
// @access  Private/Admin
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ContactOwnerMessage.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    if (message.status === 'pending') {
      message.status = 'read';
      await message.save();
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark message as read',
    });
  }
};

