import User from '../models/User.js';
import axios from 'axios';

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

// Quick eKYC API Key (Should be in .env in production)
const QUICKEKYC_API_KEY = process.env.QUICKEKYC_API_KEY;
const QUICKEKYC_BASE_URL = process.env.QUICKEKYC_BASE_URL || "https://api.quickekyc.com/api/v1";

console.log("Quick eKYC Config Loaded:", {
  BaseURL: QUICKEKYC_BASE_URL,
  KeyLoaded: !!QUICKEKYC_API_KEY
});

// @desc    Verify PAN
// @route   POST /api/profile/verify-pan
// @access  Private
export const verifyPan = async (req, res) => {
  try {
    const { panNumber } = req.body;

    // Call Quick eKYC PAN Verification API (detailed)
    const response = await axios.post(`${QUICKEKYC_BASE_URL}/pan/pan`, {
      key: QUICKEKYC_API_KEY,
      id_number: panNumber
    });

    const { data, status } = response.data; // API response structure

    if (status === 'success') {
      // Update user status
      await User.findByIdAndUpdate(req.user.id, {
        'kycDocuments.panNumber': panNumber,
        // We might want to store the verified name as well if the model supports it
      });

      res.json({
        success: true,
        data: {
          fullName: data.full_name,
          status: "VALID",
          panNumber: panNumber
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid PAN Number or Verification Failed"
      });
    }
  } catch (error) {
    console.error('PAN Verification Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message
    });
  }
};

// @desc    Send Aadhaar OTP
// @route   POST /api/profile/aadhaar-otp
// @access  Private
export const sendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;

    const response = await axios.post(`${QUICKEKYC_BASE_URL}/aadhaar-v2/generate-otp`, {
      key: QUICKEKYC_API_KEY,
      id_number: aadhaarNumber
    });

    const { data, status, request_id } = response.data;

    if (status === 'success' && data.otp_sent) {
      res.json({
        success: true,
        data: {
          refId: request_id, // Map request_id to refId for frontend
          message: "OTP sent successfully"
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.message || "Failed to send OTP"
      });
    }
  } catch (error) {
    console.error('Aadhaar OTP Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message
    });
  }
};

// @desc    Verify Aadhaar OTP
// @route   POST /api/profile/verify-aadhaar-otp
// @access  Private
export const verifyAadhaarOtp = async (req, res) => {
  try {
    const { otp, refId } = req.body;

    const response = await axios.post(`${QUICKEKYC_BASE_URL}/aadhaar-v2/submit-otp`, {
      key: QUICKEKYC_API_KEY,
      request_id: refId,
      otp: otp
    });

    const { data, status } = response.data;

    if (status === 'success') {
      // Format address from object to string
      const addr = data.address || {};
      const addressString = [
        addr.house, addr.street, addr.loc, addr.vtc,
        addr.dist, addr.state, addr.country, addr.zip
      ].filter(Boolean).join(', ');

      // Update User
      await User.findByIdAndUpdate(req.user.id, {
        'kycDocuments.aadhaarNumber': data.aadhaar_number,
        // Store verified details if needed structure exists in model
      });

      res.json({
        success: true,
        data: {
          name: data.full_name,
          dob: data.dob,
          gender: data.gender,
          address: addressString,
          photo: data.profile_image, // Base64
          status: "VERIFIED"
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: response.data.message || "OTP Verification Failed"
      });
    }
  } catch (error) {
    console.error('Aadhaar Verify Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message
    });
  }
};

// @desc    Verify Bank Account
// @route   POST /api/profile/verify-bank
// @access  Private
export const verifyBank = async (req, res) => {
  try {
    const { accountNumber, ifsc } = req.body;

    const response = await axios.post(`${QUICKEKYC_BASE_URL}/bank-verification/pd`, {
      key: QUICKEKYC_API_KEY,
      id_number: accountNumber,
      ifsc: ifsc
    });

    const { data, status } = response.data;

    if (status === 'success' && data.account_exists) {
      // Update User
      await User.findByIdAndUpdate(req.user.id, {
        'bankDetails': {
          accountNumber,
          ifscCode: ifsc,
          accountHolderName: data.full_name,
          // bankName not provided directly, try ifsc_details
          bankName: data.ifsc_details?.bank || "Verified Bank"
        }
      });

      res.json({
        success: true,
        data: {
          accountHolderName: data.full_name,
          status: "VERIFIED",
          bankName: data.ifsc_details?.bank || "Verified Bank"
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Bank Verification Failed or Invalid Account"
      });
    }
  } catch (error) {
    console.error('Bank Verification Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
