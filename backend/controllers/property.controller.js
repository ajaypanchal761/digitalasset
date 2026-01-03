import Property from '../models/Property.js';
import { calculateMonthlyEarning, calculateTotalEarnings, calculateMaturityDate } from '../utils/calculate.js';

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
export const getAllProperties = async (req, res) => {
  try {
    const { status, search } = req.query;

    console.log('📋 Backend - getAllProperties called:', {
      status,
      search,
      timestamp: new Date().toISOString()
    });

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });

    console.log('✅ Backend - Properties fetched:', {
      count: properties.length,
      propertyIds: properties.slice(0, 5).map(p => p._id),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('❌ Backend - Error fetching properties:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
export const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private/Admin
// Global counter for property IDs (in production, use Redis or database counter)
let propertyCounter = 0;

// Initialize counter from database on startup
const initializeCounter = async () => {
  try {
    const lastProperty = await Property.findOne({}, { propertyId: 1 })
      .sort({ createdAt: -1 })
      .limit(1);

    if (lastProperty && lastProperty.propertyId) {
      // Extract number from "Digital Assets-DA123" format
      const match = lastProperty.propertyId.match(/Digital Assets-DA(\d+)/);
      if (match) {
        propertyCounter = parseInt(match[1], 10);
      }
    }
  } catch (error) {
    console.error('Error initializing property counter:', error);
    propertyCounter = 0;
  }
};

// Initialize counter on module load
initializeCounter();

// Generate sequential property ID
const generatePropertyId = async () => {
  try {
    propertyCounter += 1;
    return `Digital Assets-DA${propertyCounter}`;
  } catch (error) {
    console.error('Error generating property ID:', error);
    // Fallback to timestamp-based ID if counter fails
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `Digital Assets-DA${timestamp}${random}`.toUpperCase();
  }
};

export const createProperty = async (req, res) => {
  try {
    // Generate sequential property ID
    const propertyId = await generatePropertyId();

    console.log('🏗️ Backend - createProperty called:', {
      adminId: req.user?._id || req.user?.id,
      adminEmail: req.user?.email,
      propertyId: propertyId,
      propertyData: {
        title: req.body?.title,
        propertyType: req.body?.propertyType,
        availableToInvest: req.body?.availableToInvest,
        lockInMonths: req.body?.lockInMonths,
        hasImage: !!req.body?.image,
        documentCount: req.body?.documents?.length || 0
      },
      timestamp: new Date().toISOString()
    });

    const property = await Property.create({
      ...req.body,
      propertyId: propertyId,
      createdBy: req.user._id || req.user.id,
    });

    console.log('✅ Backend - Property created successfully:', {
      mongoId: property._id,
      customPropertyId: property.propertyId,
      propertyTitle: property.title,
      lockInMonths: property.lockInMonths,
      allFields: {
        propertyId: property.propertyId,
        title: property.title,
        lockInMonths: property.lockInMonths,
        minInvestment: property.minInvestment,
        monthlyReturnRate: property.monthlyReturnRate
      },
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('❌ Backend - Error creating property:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      validationErrors: error.errors,
      errorCode: error.code,
      errorCodeName: error.codeName,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value',
        field: Object.keys(error.keyPattern)[0]
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private/Admin
export const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private/Admin
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update property status
// @route   PATCH /api/properties/:id/status
// @access  Private/Admin
export const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    property.status = status;
    await property.save();

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Calculate ROI for a property
// @route   POST /api/properties/:id/calculate-roi
// @access  Public
export const calculateROI = async (req, res) => {
  try {
    const { investmentAmount } = req.body;
    const propertyId = req.params.id;

    // Get property to get investment parameters
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Validate investment amount
    const minInvestment = property.minInvestment || 500000;
    const amount = Math.max(investmentAmount || minInvestment, minInvestment);

    // Get property parameters
    const monthlyReturnRate = property.monthlyReturnRate || 0.5;
    const lockInMonths = property.lockInMonths || 3;

    // Calculate ROI using utility functions
    const monthlyEarning = calculateMonthlyEarning(amount, monthlyReturnRate);
    const totalEarnings = calculateTotalEarnings(amount, lockInMonths, monthlyReturnRate);
    const maturityDate = calculateMaturityDate(new Date(), lockInMonths);

    // Format maturity date
    const formattedMaturityDate = maturityDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    res.json({
      success: true,
      data: {
        investmentAmount: amount,
        monthlyEarning,
        totalEarnings,
        lockInMonths,
        maturityDate: formattedMaturityDate,
        maturityDateISO: maturityDate.toISOString(),
        monthlyReturnRate,
        minInvestment,
        withdrawableAmount: amount, // After lock-in period
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


