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
  // List of test phone numbers that use default OTP
  const testNumbers = [
    '7610416911',  // Existing test number
    '9876543210',  // Additional test numbers
    '1234567890',
    '9998887776',
    '1112223334',
    // Add more test numbers here as needed
  ];
  const normalizedPhone = phone.replace(/\D/g, '');
  return testNumbers.includes(normalizedPhone);
};

// Get default OTP for test numbers
const getDefaultOTP = (phone) => {
  const normalizedPhone = phone.replace(/\D/g, '');
  // All test phone numbers use the same default OTP
  if (isTestPhoneNumber(normalizedPhone)) {
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

    // Normalize phone number for consistent lookup
    const normalizedPhone = phoneDigits;
    
    // Check if user already exists (check with normalized phone)
    const userExists = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() }, 
        { phone: normalizedPhone },
        { phone: `+91${normalizedPhone}` },
        { phone: `+91 ${normalizedPhone}` }
      ] 
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone',
      });
    }

    // OTP is required for registration
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required for registration. Please verify your phone number first.',
      });
    }

    // Default OTP for all users (for testing/development)
    const defaultOTP = '110211';

    // Verify OTP
    let otpRecord = null;
    
    // Accept default OTP 110211 for all users (even if not in database)
    if (otp === defaultOTP) {
      console.log(`🔐 Development mode: Accepting default OTP ${otp} for ${normalizedPhone} during registration`);
      // Try to find existing OTP record
      otpRecord = await OTP.findValidOTP(normalizedPhone, email, otp, 'registration');
      
      // If no record found but it's the default OTP, create a temporary valid record
      if (!otpRecord) {
        console.log(`🔐 Creating temporary OTP record for ${normalizedPhone} during registration`);
        otpRecord = await OTP.createOTP({
          phone: normalizedPhone,
          email: email.toLowerCase().trim(),
          otp: defaultOTP,
          purpose: 'registration',
        });
      }
    } else {
      // Normal verification flow - find OTP in database
      otpRecord = await OTP.findValidOTP(normalizedPhone, email, otp, 'registration');
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new OTP.',
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

    // Generate password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + 'A1!';

    // Create user with normalized phone number
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone, // Use normalized phone (10 digits)
      password: userPassword,
      isPhoneVerified: true, // Phone verified via OTP
      isEmailVerified: true, // Email verified via OTP
    });

    console.log('✅ User registered successfully:', {
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
      timestamp: new Date().toISOString()
    });

    // Emit notification to all admins via Socket.io
    try {
      const { getSocketInstance } = await import('../utils/socketInstance.js');
      const io = getSocketInstance();
      
      if (io) {
        const notification = {
          type: 'user-registered',
          title: 'New user registered',
          message: `${user.name} has registered`,
          userInfo: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          timestamp: new Date().toISOString(),
          icon: 'user-registered',
          link: `/admin/users/${user._id}`,
        };
        
        io.to('admin-room').emit('new-user-registered', notification);
        console.log('📢 Notification sent to admins: New user registered');
      }
    } catch (error) {
      console.error('❌ Error emitting user registration notification:', error);
      // Don't fail the registration if notification fails
    }

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
    
    // Use default OTP 110211 for ALL users (for testing/development)
    const otp = '110211';
    
    console.log(`🔐 Using default OTP ${otp} for ${normalizedPhone || email}`);

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

    // Default OTP for all users (for testing/development)
    const defaultOTP = '110211';
    
    // Normalize phone if provided
    let normalizedPhone = null;
    if (phone) {
      normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.length > 10) {
        normalizedPhone = normalizedPhone.slice(-10);
      }
    }

    // Find valid OTP from database
    let otpRecord = await OTP.findValidOTP(phone, email, otp, purpose);

    // Accept default OTP 110211 for all users (even if not in database)
    if (!otpRecord && otp === defaultOTP) {
      console.log(`🔐 Development mode: Accepting default OTP ${otp} for ${normalizedPhone || email}`);
      // Try to find existing OTP record
      otpRecord = await OTP.findValidOTP(normalizedPhone, email, otp, purpose);
      
      // If no record found but it's the default OTP, create a temporary valid record
      if (!otpRecord) {
        console.log(`🔐 Creating temporary OTP record for ${normalizedPhone || email}`);
        otpRecord = await OTP.createOTP({
          phone: normalizedPhone,
          email: email ? email.toLowerCase().trim() : undefined,
          otp: defaultOTP,
          purpose: purpose,
        });
      }
    }

    if (!otpRecord) {
      // Try to find if OTP exists but is invalid
      const existingOTP = await OTP.findOne({
        phone: normalizedPhone || phone || null,
        email: email ? email.toLowerCase().trim() : null,
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

    // Normalize phone number (remove all non-digits) to match how it's stored in OTP records
    let normalizedPhone = null;
    if (phone) {
      normalizedPhone = phone.replace(/\D/g, '');
      // If phone has country code, extract last 10 digits
      if (normalizedPhone.length > 10) {
        normalizedPhone = normalizedPhone.slice(-10);
      }
    }

    // Default OTP for all users (for testing/development)
    const defaultOTP = '110211';
    
    // Accept default OTP 110211 for all users (even if not in database)
    let otpRecord = null;
    if (otp === defaultOTP) {
      console.log(`🔐 Development mode: Accepting default OTP ${otp} for ${normalizedPhone || email}`);
      // Try to find existing OTP record, but don't fail if not found
      otpRecord = await OTP.findValidOTP(normalizedPhone, email, otp, 'login');
      
      // If no record found but it's the default OTP, create a temporary valid record
      if (!otpRecord) {
        console.log(`🔐 Creating temporary OTP record for ${normalizedPhone || email}`);
        // Create a temporary OTP record that will be marked as verified
        otpRecord = await OTP.createOTP({
          phone: normalizedPhone,
          email: email ? email.toLowerCase().trim() : undefined,
          otp: defaultOTP,
          purpose: 'login',
        });
      }
    } else {
      // Normal verification flow - find OTP in database
      otpRecord = await OTP.findValidOTP(normalizedPhone, email, otp, 'login');
    }

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

    // Find user - must be registered first
    // Normalize phone for user lookup too
    const userQueryConditions = [];
    
    if (email) {
      userQueryConditions.push({ email: email.toLowerCase().trim() });
    }
    
    if (normalizedPhone) {
      // Try to find user by normalized phone (10 digits) or with country code variations
      userQueryConditions.push(
        { phone: normalizedPhone },
        { phone: `+91${normalizedPhone}` },
        { phone: `+91 ${normalizedPhone}` }
      );
    }
    
    const user = userQueryConditions.length > 0 
      ? await User.findOne({ $or: userQueryConditions })
      : null;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found. Please register first using the registration page.',
      });
    }

      // Update verification status
      if (phone) user.isPhoneVerified = true;
      if (email) user.isEmailVerified = true;
      await user.save();

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



