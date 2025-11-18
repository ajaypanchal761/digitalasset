import User from '../models/User.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/jwt.js';
import { generateOTP, verifyOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required',
      });
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpKey = email || phone;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(otpKey, { otp, expiresAt });

    // Send OTP via email if email provided
    if (email) {
      const emailResult = await sendOTPEmail(email, otp);
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email',
        });
      }
    }

    // TODO: Send OTP via SMS if phone provided

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    const otpKey = email || phone;
    const storedOTP = otpStore.get(otpKey);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired',
      });
    }

    // Check if OTP expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Remove OTP after verification
    otpStore.delete(otpKey);

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login with OTP
// @route   POST /api/auth/login-otp
// @access  Public
export const loginWithOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    // Verify OTP first
    const otpKey = email || phone;
    const storedOTP = otpStore.get(otpKey);

    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name: email ? email.split('@')[0] : phone,
        email: email || `${phone}@digitalasset.in`,
        phone: phone || '',
        password: 'otp-login', // Temporary password
      });
    }

    // Remove OTP
    otpStore.delete(otpKey);

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wallet: user.wallet,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate reset token
    const resetToken = generateToken(user._id);
    // TODO: Store reset token in database with expiry
    // TODO: Send reset email

    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Verify token and get user
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


