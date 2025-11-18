import User from '../models/User.js';
import Admin from '../models/Admin.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/jwt.js';
import { generateOTP } from '../utils/otp.js';
import { sendOTPEmail } from '../utils/email.js';
import smsHubIndiaService from '../services/smsHubIndiaService.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Check if phone number is a test/bypass number
const isTestPhoneNumber = (phone) => {
  const testNumbers = ['7610416911'];
  const normalizedPhone = phone.replace(/\D/g, '');
  return testNumbers.includes(normalizedPhone);
};

// Get default OTP for test numbers
const getDefaultOTP = (phone) => {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone === '7610416911') {
    return '110211';
  }
  return null;
};

// @desc    Register user (after OTP verification)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required',
      });
    }

    // Validate phone format
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone',
      });
    }

    // If OTP is provided, verify it first
    if (otp) {
      const otpRecord = await OTP.findValidOTP(phone, email, otp, 'registration');
      
      if (!otpRecord || otpRecord.otp !== otp) {
        if (otpRecord) {
          await otpRecord.incrementAttempts();
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please verify OTP first.',
        });
      }

      // Mark OTP as verified
      await otpRecord.markAsVerified();
    }

    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!';

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: userPassword,
      isPhoneVerified: true,
      isEmailVerified: true,
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
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register user. Please try again.',
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
    console.log('📨 Send OTP request received:', { email: req.body.email, phone: req.body.phone });
    
    const { email, phone, purpose = 'registration' } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required',
      });
    }

    // Validate phone format if provided
    let normalizedPhone = null;
    if (phone) {
      normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit phone number',
        });
      }
    }

    // Check if this is a test phone number with default OTP
    const isTestNumber = normalizedPhone && isTestPhoneNumber(normalizedPhone);
    const defaultOTP = normalizedPhone ? getDefaultOTP(normalizedPhone) : null;
    
    // Generate OTP (use default for test numbers)
    const otp = isTestNumber && defaultOTP ? defaultOTP : generateOTP(6);
    
    if (isTestNumber) {
      console.log(`🔐 Using default OTP ${otp} for test number ${normalizedPhone}`);
    } else {
      console.log(`🔐 Generated OTP: ${otp} for ${normalizedPhone || email}`);
    }

    // Delete any existing OTPs for this phone/email
    if (normalizedPhone) {
      await OTP.deleteMany({ phone: normalizedPhone, isVerified: false });
    }
    if (email) {
      await OTP.deleteMany({ email, isVerified: false });
    }

    // Create OTP record in database
    const otpData = {
      otp,
      purpose,
    };
    
    if (normalizedPhone) {
      otpData.phone = normalizedPhone;
    }
    if (email) {
      otpData.email = email.toLowerCase().trim();
    }
    
    console.log('💾 Creating OTP record in database...');
    console.log('💾 OTP Data:', { ...otpData, otp: '***' }); // Don't log actual OTP
    
    let otpRecord;
    try {
      otpRecord = await OTP.createOTP(otpData);
      console.log('✅ OTP record created:', otpRecord._id);
    } catch (dbError) {
      console.error('❌ Database error creating OTP:', dbError);
      throw new Error(`Failed to create OTP record: ${dbError.message}`);
    }

    let smsSent = false;
    let emailSent = false;
    let smsMessageId = null;

    // Send OTP via SMS if phone provided (skip for test numbers)
    if (normalizedPhone && smsHubIndiaService.isConfigured() && !isTestNumber) {
      try {
        console.log(`📱 Attempting to send SMS to ${normalizedPhone}...`);
        const smsResult = await smsHubIndiaService.sendOTP(normalizedPhone, otp);
        if (smsResult.success) {
          smsSent = true;
          smsMessageId = smsResult.messageId;
          otpRecord.smsSent = true;
          otpRecord.smsMessageId = smsMessageId;
          await otpRecord.save();
          console.log(`✅ SMS OTP sent to ${normalizedPhone}, Message ID: ${smsMessageId}`);
        } else {
          console.warn('⚠️ SMS service returned unsuccessful:', smsResult);
        }
      } catch (smsError) {
        console.error('❌ SMS sending failed:', smsError.message);
        console.error('❌ SMS error details:', smsError);
        // Continue even if SMS fails, email might work
      }
    } else if (normalizedPhone && isTestNumber) {
      // For test numbers, mark as sent (even though we didn't send SMS)
      smsSent = true;
      otpRecord.smsSent = true;
      await otpRecord.save();
      console.log(`📵 Skipped SMS for test number ${normalizedPhone}. Using default OTP ${otp}.`);
    } else if (normalizedPhone) {
      console.warn('⚠️ SMS Hub India not configured. Skipping SMS.');
    }

    // Send OTP via email if email provided
    if (email) {
      try {
        const emailResult = await sendOTPEmail(email, otp);
        if (emailResult.success) {
          emailSent = true;
          otpRecord.emailSent = true;
          await otpRecord.save();
          console.log(`✅ Email OTP sent to ${email}`);
        }
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
      }
    }

    // Check if at least one method succeeded
    if (!smsSent && !emailSent) {
      // Delete the OTP record if sending failed
      await OTP.findByIdAndDelete(otpRecord._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please check your contact details and try again.',
      });
    }

    res.json({
      success: true,
      message: isTestNumber ? 'OTP ready (test number - SMS skipped)' : 'OTP sent successfully',
      method: isTestNumber ? 'Test' : (smsSent ? 'SMS' : 'Email'),
    });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return more detailed error message
    let errorMessage = 'Failed to send OTP. Please try again.';
    
    // Provide specific error messages
    if (error.name === 'ValidationError') {
      errorMessage = error.message || 'Validation error. Please check your input.';
    } else if (error.message) {
      // Extract clean error message (avoid Mongoose error objects)
      errorMessage = typeof error.message === 'string' 
        ? error.message 
        : 'An error occurred while sending OTP.';
    }
    
    // Create clean response object (avoid read-only properties)
    const errorResponse = {
      success: false,
      message: errorMessage,
    };
    
    // Only add stack in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = typeof error.message === 'string' ? error.message : 'Unknown error';
      if (typeof error.stack === 'string') {
        errorResponse.stack = error.stack;
      }
    }
    
    res.status(500).json(errorResponse);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, phone, otp, purpose = 'verification' } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required',
      });
    }

    // Find valid OTP from database
    const otpRecord = await OTP.findValidOTP(phone, email, otp, purpose);

    if (!otpRecord) {
      // Try to find if OTP exists but is invalid
      const existingOTP = await OTP.findOne({
        phone: phone || null,
        email: email || null,
        otp,
        purpose,
      });

      if (existingOTP) {
        if (existingOTP.isVerified) {
          return res.status(400).json({
            success: false,
            message: 'OTP has already been used',
          });
        }
        if (existingOTP.expiresAt <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.',
          });
        }
        if (existingOTP.attempts >= existingOTP.maxAttempts) {
          return res.status(400).json({
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          });
        }
        // Increment attempts
        await existingOTP.incrementAttempts();
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Mark OTP as verified
    await otpRecord.markAsVerified();

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP. Please try again.',
    });
  }
};

// @desc    Login with OTP
// @route   POST /api/auth/login-otp
// @access  Public
export const loginWithOTP = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is required',
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    // Verify OTP first
    const otpRecord = await OTP.findValidOTP(phone, email, otp, 'login');

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // Verify OTP code
    if (otpRecord.otp !== otp) {
      await otpRecord.incrementAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Mark OTP as verified
    await otpRecord.markAsVerified();

    // Find or create user
    let user = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      // Create new user if doesn't exist
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      user = await User.create({
        name: email ? email.split('@')[0] : `User${phone.slice(-4)}`,
        email: email || `${phone}@digitalasset.in`,
        phone: phone || '',
        password: tempPassword,
        isPhoneVerified: phone ? true : false,
        isEmailVerified: email ? true : false,
      });
    } else {
      // Update verification status
      if (phone) user.isPhoneVerified = true;
      if (email) user.isEmailVerified = true;
      await user.save();
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
    console.error('❌ Login with OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to login. Please try again.',
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


