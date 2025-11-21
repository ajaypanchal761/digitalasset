import Admin from '../models/Admin.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRE } from '../config/jwt.js';
import { generateOTP } from '../utils/otp.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../utils/email.js';
import smsHubIndiaService from '../services/smsHubIndiaService.js';

// Generate JWT Token with explicit iat and exp (matching user token format)
const generateToken = (id) => {
  try {
    // Validate JWT_SECRET
    if (!JWT_SECRET || JWT_SECRET === 'default-secret-key') {
      console.warn('⚠️  Using default JWT_SECRET. This is insecure!');
    }
    
    // Parse JWT_EXPIRE to calculate expiration in seconds
    // JWT_EXPIRE format: '7d', '30d', '1h', etc.
    let expirationSeconds = 7 * 24 * 60 * 60; // Default to 7 days
    
    if (JWT_EXPIRE) {
      const match = JWT_EXPIRE.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
          case 'd':
            expirationSeconds = value * 24 * 60 * 60;
            break;
          case 'h':
            expirationSeconds = value * 60 * 60;
            break;
          case 'm':
            expirationSeconds = value * 60;
            break;
          case 's':
            expirationSeconds = value;
            break;
        }
      }
    }
    
    // Calculate issued at time (current time in seconds)
    const iat = Math.floor(Date.now() / 1000);
    
    // Calculate expiration time using JWT_EXPIRE (same as user token)
    const exp = iat + expirationSeconds;
    
    // Create token payload with id, iat, and exp (matching user token format)
    const payload = {
      id: id.toString(), // Ensure id is a string
      iat: iat,
      exp: exp
    };
    
    console.log('🎫 Admin token payload:', { 
      id: payload.id, 
      iat: payload.iat, 
      exp: payload.exp,
      expirationDays: (expirationSeconds / (24 * 60 * 60)).toFixed(2),
      expiresIn: JWT_EXPIRE
    });
    
    // Sign token with HS256 algorithm (same as user token)
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256'
    });
    
    if (!token) {
      throw new Error('jwt.sign returned null or undefined');
    }
    
    // Return both token and timestamp
    return {
      token: token,
      tokenTimestamp: Date.now() // Current time in milliseconds
    };
  } catch (error) {
    console.error('❌ generateToken error:', error);
    throw error;
  }
};

// Check if phone number is an admin test number
const isAdminTestPhoneNumber = (phone) => {
  const adminTestNumbers = ['9999999999', '8888888888', '7777777777'];
  const normalizedPhone = phone.replace(/\D/g, '');
  return adminTestNumbers.includes(normalizedPhone);
};

// Get default OTP for admin test numbers
const getAdminDefaultOTP = (phone) => {
  const normalizedPhone = phone.replace(/\D/g, '');
  // All admin test numbers use the same default OTP for simplicity
  if (isAdminTestPhoneNumber(normalizedPhone)) {
    return '123456';
  }
  return null;
};

// @desc    Send OTP for admin login/register
// @route   POST /api/admin-auth/send-otp
// @access  Public
export const sendAdminOTP = async (req, res) => {
  try {
    console.log('📨 Admin Send OTP request received:', { email: req.body.email, phone: req.body.phone });
    
    const { email, phone, purpose = 'login' } = req.body;

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

    // Check if this is an admin test phone number with default OTP
    const isTestNumber = normalizedPhone && isAdminTestPhoneNumber(normalizedPhone);
    const defaultOTP = normalizedPhone ? getAdminDefaultOTP(normalizedPhone) : null;
    
    // Generate OTP (use default for test numbers)
    const otp = isTestNumber && defaultOTP ? defaultOTP : generateOTP(6);
    
    if (isTestNumber) {
      console.log(`🔐 Using default OTP ${otp} for admin test number ${normalizedPhone}`);
    } else {
      console.log(`🔐 Generated OTP: ${otp} for admin ${normalizedPhone || email}`);
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
    
    console.log('💾 Creating admin OTP record in database...');
    
    let otpRecord;
    try {
      otpRecord = await OTP.createOTP(otpData);
      console.log('✅ Admin OTP record created:', otpRecord._id);
    } catch (dbError) {
      console.error('❌ Database error creating admin OTP:', dbError);
      throw new Error(`Failed to create OTP record: ${dbError.message}`);
    }

    let smsSent = false;
    let emailSent = false;

    // Send OTP via SMS if phone provided (skip for test numbers)
    if (normalizedPhone && smsHubIndiaService.isConfigured() && !isTestNumber) {
      try {
        console.log(`📱 Attempting to send SMS to ${normalizedPhone}...`);
        const smsResult = await smsHubIndiaService.sendOTP(normalizedPhone, otp);
        if (smsResult.success) {
          smsSent = true;
          otpRecord.smsSent = true;
          otpRecord.smsMessageId = smsResult.messageId;
          await otpRecord.save();
          console.log(`✅ SMS OTP sent to ${normalizedPhone}`);
        }
      } catch (smsError) {
        console.error('❌ SMS sending failed:', smsError.message);
      }
    } else if (normalizedPhone && isTestNumber) {
      smsSent = true;
      otpRecord.smsSent = true;
      await otpRecord.save();
      console.log(`📵 Skipped SMS for admin test number ${normalizedPhone}. Using default OTP ${otp}.`);
    }

    // Send OTP via email if email provided
    if (email && !isTestNumber) {
      try {
        await sendOTPEmail(email, otp);
        emailSent = true;
        otpRecord.emailSent = true;
        await otpRecord.save();
        console.log(`✅ Email OTP sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: isTestNumber 
        ? `Default OTP for admin test number: ${otp}`
        : smsSent || emailSent 
          ? 'OTP sent successfully' 
          : 'OTP generated (SMS/Email service not configured)',
      otp: isTestNumber ? otp : undefined, // Only return OTP for test numbers
    });
  } catch (error) {
    console.error('❌ Admin Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    });
  }
};

// @desc    Register admin with password (only one admin allowed)
// @route   POST /api/admin-auth/register
// @access  Public
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required',
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

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if admin already exists (only one admin allowed)
    const adminExists = await Admin.countDocuments();
    if (adminExists > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists. Only one admin is allowed in the system.',
      });
    }

    // Check if email or phone is already used
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email or phone',
      });
    }

    // Create admin (the pre-save hook will ensure only one admin exists)
    const admin = await Admin.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
    });

    // Generate token with timestamp
    const { token, tokenTimestamp } = generateToken(admin._id);

    res.status(201).json({
      success: true,
      token,
      tokenTimestamp,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('❌ Admin Register error:', error);
    
    // Handle the "only one admin" error from pre-save hook
    if (error.message.includes('Only one admin')) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists. Only one admin is allowed in the system.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register admin. Please try again.',
    });
  }
};

// @desc    Login admin with password (email only)
// @route   POST /api/admin-auth/login
// @access  Public
export const loginAdmin = async (req, res) => {
  try {
    console.log('🔐 Admin login attempt:', { email: req.body?.email });
    
    const { email, password } = req.body;

    if (!email) {
      console.log('❌ Admin login failed: Email is required');
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!password) {
      console.log('❌ Admin login failed: Password is required');
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Find admin by email
    console.log('🔍 Searching for admin with email:', email);
    const admin = await Admin.findOne({ email }).select('+password'); // Include password field

    if (!admin) {
      console.log('❌ Admin login failed: Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ Admin found:', { id: admin._id, email: admin.email, role: admin.role });

    // Verify password
    console.log('🔑 Verifying password...');
    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Admin login failed: Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('✅ Password verified successfully');

    // Generate token with timestamp
    console.log('🎫 Generating JWT token for admin:', admin._id);
    let token, tokenTimestamp;
    try {
      const tokenResult = generateToken(admin._id);
      token = tokenResult.token;
      tokenTimestamp = tokenResult.tokenTimestamp;
      
      if (!token) {
        throw new Error('Token generation returned null or undefined');
      }
      
      console.log('✅ Token generated successfully:', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 50) + '...',
        tokenTimestamp
      });
    } catch (tokenError) {
      console.error('❌ Token generation failed:', tokenError);
      throw new Error('Failed to generate authentication token');
    }

    const responseData = {
      success: true,
      token,
      tokenTimestamp,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role || 'admin', // Ensure role is always 'admin'
      },
    };

    console.log('✅ Admin login successful, sending response:', {
      success: responseData.success,
      hasToken: !!responseData.token,
      userId: responseData.user.id,
      userEmail: responseData.user.email,
      userRole: responseData.user.role
    });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Admin Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to login. Please try again.',
    });
  }
};

// @desc    Login admin with OTP (kept for backward compatibility, but not recommended)
// @route   POST /api/admin-auth/login-otp
// @access  Public
export const loginAdminWithOTP = async (req, res) => {
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

    // Find admin - must be registered first
    const admin = await Admin.findOne({
      $or: [{ email }, { phone }],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found. Please register first using the admin registration page.',
      });
    }

    // Generate token with timestamp
    const { token, tokenTimestamp } = generateToken(admin._id);

    res.json({
      success: true,
      token,
      tokenTimestamp,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role || 'admin', // Ensure role is always 'admin'
      },
    });
  } catch (error) {
    console.error('❌ Admin Login OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to login. Please try again.',
    });
  }
};

// @desc    Get current admin user
// @route   GET /api/admin-auth/me
// @access  Private/Admin
export const getAdminMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role || 'admin', // Ensure role is always 'admin'
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get admin user',
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin-auth/profile
// @access  Private/Admin
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;

    // IMPORTANT: Select password field explicitly to use it for verification
    const admin = await Admin.findById(req.user.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Update name if provided
    if (name) {
      admin.name = name;
    }

    // Update email if provided (check for uniqueness)
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin && existingAdmin._id.toString() !== admin._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      admin.email = email.toLowerCase();
    }

    // Update phone if provided
    if (phone) {
      admin.phone = phone;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      // Verify current password
      const isPasswordMatch = await admin.matchPassword(currentPassword);
      if (!isPasswordMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      admin.password = newPassword;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role || 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

// @desc    Forgot admin password - send reset email
// @route   POST /api/admin-auth/forgot-password
// @access  Public
export const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    // Don't reveal if admin exists or not (security best practice)
    // Always return success message even if admin doesn't exist
    if (admin) {
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { id: admin._id, type: 'admin-reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      try {
        await sendPasswordResetEmail(admin.email, resetToken, 'admin');
      } catch (emailError) {
        console.error('❌ Failed to send password reset email:', emailError);
        // Still return success to not reveal admin existence
      }
    }

    // Always return success message (don't reveal if admin exists)
    res.json({
      success: true,
      message: 'If an admin account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('❌ Forgot Admin Password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process password reset request',
    });
  }
};

// @desc    Reset admin password
// @route   POST /api/admin-auth/reset-password
// @access  Public
export const resetAdminPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is for admin reset
      if (decoded.type !== 'admin-reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token',
        });
      }
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Reset token has expired. Please request a new one.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Find admin by ID from token
    const admin = await Admin.findById(decoded.id).select('+password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Update password (pre-save hook will hash it)
    admin.password = password;
    await admin.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('❌ Reset Admin Password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};

