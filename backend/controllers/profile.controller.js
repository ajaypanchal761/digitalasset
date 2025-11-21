import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        wallet: user.wallet,
        kycStatus: user.kycStatus,
        kycDocuments: user.kycDocuments,
        kycSubmittedAt: user.kycSubmittedAt,
        kycRejectionReason: user.kycRejectionReason,
        bankDetails: user.bankDetails,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl; // Allow null to remove avatar

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit KYC documents
// @route   POST /api/profile/kyc
// @access  Private
export const submitKYC = async (req, res) => {
  try {
    const { panNumber, aadhaarNumber } = req.body;
    const files = req.files;

    // Validate required fields
    if (!panNumber || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'PAN number and Aadhaar number are required',
      });
    }

    // Validate PAN format (10 characters, alphanumeric)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN format. PAN should be 10 characters (e.g., ABCDE1234F)',
      });
    }

    // Validate Aadhaar format (12 digits)
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar format. Aadhaar should be 12 digits',
      });
    }

    // Validate all files are uploaded
    if (!files || !files.panCard || !files.aadhaarCard || !files.photo || !files.addressProof) {
      return res.status(400).json({
        success: false,
        message: 'All documents are required: PAN Card, Aadhaar Card, Photo, and Address Proof',
      });
    }

    // Validate photo is an image (not PDF)
    if (files.photo[0].mimetype === 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Profile photo must be an image file (JPG, PNG, etc.), not PDF',
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Upload documents to Cloudinary and get URLs
    const panCardUrl = files.panCard[0].path;
    const aadhaarCardUrl = files.aadhaarCard[0].path;
    const photoUrl = files.photo[0].path;
    const addressProofUrl = files.addressProof[0].path;

    // Update user KYC documents
    user.kycDocuments = {
      panCard: panCardUrl,
      aadhaarCard: aadhaarCardUrl,
      photo: photoUrl,
      addressProof: addressProofUrl,
      panNumber: panNumber.toUpperCase(),
      aadhaarNumber: aadhaarNumber,
    };

    // Set KYC status to pending
    user.kycStatus = 'pending';
    user.kycSubmittedAt = new Date();
    user.kycRejectionReason = null; // Clear any previous rejection reason

    await user.save();

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Your documents are under review.',
      data: {
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt,
      },
    });
  } catch (error) {
    console.error('❌ Submit KYC error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit KYC documents. Please try again.',
    });
  }
};

// @desc    Update bank details
// @route   PUT /api/profile/bank-details
// @access  Private
export const updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    const user = await User.findById(req.user.id);

    user.bankDetails = {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    };

    await user.save();

    res.json({
      success: true,
      data: user.bankDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


