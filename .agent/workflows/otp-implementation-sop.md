---
description: Complete OTP Implementation SOP - Flow, Logic & Best Practices
---

# OTP Implementation - Complete SOP (Standard Operating Procedure)

## 📋 Table of Contents
1. [Overview](#overview)
2. [OTP Flow Architecture](#otp-flow-architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Best Practices](#security-best-practices)
6. [Testing Checklist](#testing-checklist)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## 🎯 Overview

### What is OTP?
OTP (One-Time Password) ek temporary password hai jo user authentication ke liye use hota hai. Ye password sirf ek baar use ho sakta hai aur limited time ke liye valid rehta hai.

### Use Cases
- **User Registration/Signup** - Naye user ka mobile/email verify karna
- **Login Authentication** - Password-less login
- **Password Reset** - Forgot password flow
- **Transaction Verification** - Payment ya sensitive operations confirm karna
- **Two-Factor Authentication (2FA)** - Extra security layer

### Types of OTP
1. **SMS OTP** - Mobile number par SMS bheja jata hai
2. **Email OTP** - Email address par bheja jata hai
3. **WhatsApp OTP** - WhatsApp par message bheja jata hai
4. **Authenticator App OTP** - Google Authenticator, Authy etc.

---

## 🔄 OTP Flow Architecture

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         OTP FLOW DIAGRAM                         │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User Input
┌──────────────┐
│ User enters  │
│ Mobile/Email │
└──────┬───────┘
       │
       ▼
STEP 2: Request OTP
┌──────────────────────┐
│ Frontend sends       │
│ POST /api/send-otp   │
│ { mobile: "..." }    │
└──────┬───────────────┘
       │
       ▼
STEP 3: Backend Processing
┌─────────────────────────────────────┐
│ 1. Validate mobile/email format     │
│ 2. Check rate limiting              │
│ 3. Generate 6-digit OTP              │
│ 4. Set expiry time (5-10 mins)      │
│ 5. Hash OTP before storing           │
│ 6. Save to database/cache            │
└──────┬──────────────────────────────┘
       │
       ▼
STEP 4: Send OTP
┌─────────────────────────────────────┐
│ SMS Gateway / Email Service         │
│ (Twilio, MSG91, SendGrid, etc.)     │
└──────┬──────────────────────────────┘
       │
       ▼
STEP 5: User Receives OTP
┌──────────────┐
│ User gets    │
│ OTP: 123456  │
└──────┬───────┘
       │
       ▼
STEP 6: User Enters OTP
┌──────────────────────┐
│ User inputs OTP in   │
│ verification screen  │
└──────┬───────────────┘
       │
       ▼
STEP 7: Verify OTP
┌──────────────────────┐
│ Frontend sends       │
│ POST /api/verify-otp │
│ { mobile, otp }      │
└──────┬───────────────┘
       │
       ▼
STEP 8: Backend Validation
┌─────────────────────────────────────┐
│ 1. Check if OTP exists               │
│ 2. Verify OTP hasn't expired         │
│ 3. Compare hashed OTP                │
│ 4. Check attempt count (max 3-5)    │
│ 5. Mark OTP as used                  │
└──────┬──────────────────────────────┘
       │
       ├─── ✅ Valid
       │    ┌────────────────────────┐
       │    │ 1. Generate JWT token  │
       │    │ 2. Create user session │
       │    │ 3. Delete used OTP     │
       │    │ 4. Return success      │
       │    └────────────────────────┘
       │
       └─── ❌ Invalid
            ┌────────────────────────┐
            │ 1. Increment attempts  │
            │ 2. Return error        │
            │ 3. Block after max     │
            └────────────────────────┘
```

---

## 🔧 Backend Implementation

### 1. Database Schema

#### MongoDB Schema Example
```javascript
// models/Otp.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  // User identifier
  identifier: {
    type: String,
    required: true,
    index: true // Fast lookup ke liye
  },
  
  identifierType: {
    type: String,
    enum: ['mobile', 'email'],
    required: true
  },
  
  // Hashed OTP (security ke liye)
  otpHash: {
    type: String,
    required: true
  },
  
  // OTP expiry time
  expiresAt: {
    type: Date,
    required: true,
    index: true // Auto-delete ke liye
  },
  
  // Verification attempts tracking
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts allowed
  },
  
  // OTP verified ya nahi
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // OTP ka purpose
  purpose: {
    type: String,
    enum: ['signup', 'login', 'reset-password', 'transaction'],
    required: true
  },
  
  // IP address tracking (security)
  ipAddress: String,
  
  // Device info (optional)
  deviceInfo: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes mein auto-delete (TTL index)
  }
});

// Index for faster queries
otpSchema.index({ identifier: 1, purpose: 1 });

// Method to compare OTP
otpSchema.methods.compareOtp = async function(candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.otpHash);
};

module.exports = mongoose.model('Otp', otpSchema);
```

#### SQL Schema Example (MySQL/PostgreSQL)
```sql
CREATE TABLE otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  identifier VARCHAR(255) NOT NULL,
  identifier_type ENUM('mobile', 'email') NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  purpose ENUM('signup', 'login', 'reset-password', 'transaction') NOT NULL,
  ip_address VARCHAR(45),
  device_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_identifier (identifier),
  INDEX idx_expires_at (expires_at),
  INDEX idx_identifier_purpose (identifier, purpose)
);

-- Auto-delete expired OTPs (MySQL Event)
CREATE EVENT delete_expired_otps
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM otps WHERE expires_at < NOW();
```

---

### 2. Environment Variables

```env
# .env file

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=60 # seconds
OTP_RATE_LIMIT_MAX_REQUESTS=3

# SMS Gateway (MSG91 Example)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=YOURID
MSG91_TEMPLATE_ID=your_template_id

# Twilio (Alternative)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service (SendGrid Example)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=7d

# Redis (for rate limiting - optional)
REDIS_URL=redis://localhost:6379
```

---

### 3. OTP Generation & Hashing

```javascript
// utils/otpHelper.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class OtpHelper {
  /**
   * Generate random OTP
   * @param {number} length - OTP ki length (default: 6)
   * @returns {string} - Generated OTP
   */
  static generateOtp(length = 6) {
    // Cryptographically secure random number
    const otp = crypto.randomInt(
      Math.pow(10, length - 1),
      Math.pow(10, length)
    ).toString();
    
    return otp;
  }

  /**
   * Hash OTP before storing
   * @param {string} otp - Plain OTP
   * @returns {Promise<string>} - Hashed OTP
   */
  static async hashOtp(otp) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(otp, salt);
  }

  /**
   * Compare OTP with hash
   * @param {string} plainOtp - User entered OTP
   * @param {string} hashedOtp - Stored hashed OTP
   * @returns {Promise<boolean>}
   */
  static async compareOtp(plainOtp, hashedOtp) {
    return await bcrypt.compare(plainOtp, hashedOtp);
  }

  /**
   * Calculate expiry time
   * @param {number} minutes - Expiry in minutes
   * @returns {Date}
   */
  static getExpiryTime(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Check if OTP is expired
   * @param {Date} expiryTime
   * @returns {boolean}
   */
  static isExpired(expiryTime) {
    return new Date() > new Date(expiryTime);
  }
}

module.exports = OtpHelper;
```

---

### 4. SMS/Email Service Integration

```javascript
// services/smsService.js
const axios = require('axios');

class SmsService {
  /**
   * Send OTP via MSG91
   */
  static async sendViaMSG91(mobile, otp) {
    try {
      const url = 'https://api.msg91.com/api/v5/otp';
      
      const response = await axios.post(url, {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: mobile,
        authkey: process.env.MSG91_AUTH_KEY,
        otp: otp,
        otp_expiry: process.env.OTP_EXPIRY_MINUTES || 10
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('MSG91 Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP via Twilio
   */
  static async sendViaTwilio(mobile, otp) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      const message = await client.messages.create({
        body: `Your OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: mobile
      });

      return {
        success: true,
        data: message
      };
    } catch (error) {
      console.error('Twilio Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP via Fast2SMS
   */
  static async sendViaFast2SMS(mobile, otp) {
    try {
      const url = 'https://www.fast2sms.com/dev/bulkV2';
      
      const response = await axios.post(url, {
        variables_values: otp,
        route: 'otp',
        numbers: mobile
      }, {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Fast2SMS Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SmsService;
```

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  /**
   * Send OTP via SendGrid
   */
  static async sendViaSendGrid(email, otp) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Your OTP Verification Code',
        text: `Your OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>OTP Verification</h2>
            <p>Your One-Time Password is:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>
            <p style="color: #f44336;">Do not share this OTP with anyone.</p>
          </div>
        `
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('SendGrid Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send OTP via Nodemailer (Gmail/SMTP)
   */
  static async sendViaNodemailer(email, otp) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>OTP Verification</h2>
            <p>Your One-Time Password is:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.</p>
            <p style="color: #f44336;">Do not share this OTP with anyone.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Nodemailer Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
```

---

### 5. Rate Limiting Middleware

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client (optional, for distributed systems)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

/**
 * Rate limiter for OTP requests
 * Prevents spam and abuse
 */
const otpRateLimiter = rateLimit({
  // Use Redis for distributed systems, otherwise in-memory
  store: process.env.REDIS_URL ? new RedisStore({
    client: redisClient,
    prefix: 'otp_limit:'
  }) : undefined,
  
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW) * 1000 || 60000, // 1 minute
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS) || 3, // 3 requests per window
  
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  // Custom key generator (by IP + identifier)
  keyGenerator: (req) => {
    return `${req.ip}_${req.body.mobile || req.body.email}`;
  },
  
  // Skip successful requests (optional)
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

module.exports = { otpRateLimiter };
```

---

### 6. OTP Controller

```javascript
// controllers/otpController.js
const Otp = require('../models/Otp');
const OtpHelper = require('../utils/otpHelper');
const SmsService = require('../services/smsService');
const EmailService = require('../services/emailService');

class OtpController {
  /**
   * Send OTP
   * POST /api/otp/send
   */
  static async sendOtp(req, res) {
    try {
      const { identifier, identifierType, purpose } = req.body;

      // Validation
      if (!identifier || !identifierType || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Identifier, type, and purpose are required'
        });
      }

      // Validate format
      if (identifierType === 'mobile') {
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(identifier)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format'
          });
        }
      } else if (identifierType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      // Delete previous OTPs for this identifier and purpose
      await Otp.deleteMany({ identifier, purpose, isVerified: false });

      // Generate OTP
      const otp = OtpHelper.generateOtp(parseInt(process.env.OTP_LENGTH) || 6);
      const otpHash = await OtpHelper.hashOtp(otp);
      const expiresAt = OtpHelper.getExpiryTime(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

      // Save to database
      const otpDoc = await Otp.create({
        identifier,
        identifierType,
        otpHash,
        expiresAt,
        purpose,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent']
      });

      // Send OTP
      let sendResult;
      if (identifierType === 'mobile') {
        // Choose your SMS service
        sendResult = await SmsService.sendViaMSG91(identifier, otp);
        // OR
        // sendResult = await SmsService.sendViaTwilio(identifier, otp);
        // OR
        // sendResult = await SmsService.sendViaFast2SMS(identifier, otp);
      } else if (identifierType === 'email') {
        sendResult = await EmailService.sendViaSendGrid(identifier, otp);
        // OR
        // sendResult = await EmailService.sendViaNodemailer(identifier, otp);
      }

      if (!sendResult.success) {
        // Delete OTP if sending failed
        await Otp.findByIdAndDelete(otpDoc._id);
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }

      // For development/testing - log OTP (REMOVE IN PRODUCTION!)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 OTP for ${identifier}: ${otp}`);
      }

      res.status(200).json({
        success: true,
        message: `OTP sent successfully to ${identifierType}`,
        data: {
          identifier,
          expiresIn: process.env.OTP_EXPIRY_MINUTES || 10 // minutes
        }
      });

    } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify OTP
   * POST /api/otp/verify
   */
  static async verifyOtp(req, res) {
    try {
      const { identifier, otp, purpose } = req.body;

      // Validation
      if (!identifier || !otp || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Identifier, OTP, and purpose are required'
        });
      }

      // Find OTP record
      const otpDoc = await Otp.findOne({
        identifier,
        purpose,
        isVerified: false
      }).sort({ createdAt: -1 }); // Latest OTP

      if (!otpDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Check if expired
      if (OtpHelper.isExpired(otpDoc.expiresAt)) {
        await Otp.findByIdAndDelete(otpDoc._id);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // Check max attempts
      if (otpDoc.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS || 5)) {
        await Otp.findByIdAndDelete(otpDoc._id);
        return res.status(400).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        });
      }

      // Verify OTP
      const isValid = await otpDoc.compareOtp(otp);

      if (!isValid) {
        // Increment attempts
        otpDoc.attempts += 1;
        await otpDoc.save();

        return res.status(400).json({
          success: false,
          message: `Invalid OTP. ${parseInt(process.env.OTP_MAX_ATTEMPTS || 5) - otpDoc.attempts} attempts remaining.`
        });
      }

      // Mark as verified
      otpDoc.isVerified = true;
      await otpDoc.save();

      // Generate JWT token (if needed for authentication)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { identifier, purpose },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '7d' }
      );

      // Delete OTP after successful verification
      await Otp.findByIdAndDelete(otpDoc._id);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          token,
          identifier
        }
      });

    } catch (error) {
      console.error('Verify OTP Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Resend OTP
   * POST /api/otp/resend
   */
  static async resendOtp(req, res) {
    // Same logic as sendOtp
    return OtpController.sendOtp(req, res);
  }
}

module.exports = OtpController;
```

---

### 7. Routes

```javascript
// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const OtpController = require('../controllers/otpController');
const { otpRateLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all OTP routes
router.use(otpRateLimiter);

// Send OTP
router.post('/send', OtpController.sendOtp);

// Verify OTP
router.post('/verify', OtpController.verifyOtp);

// Resend OTP
router.post('/resend', OtpController.resendOtp);

module.exports = router;
```

```javascript
// app.js or server.js
const express = require('express');
const otpRoutes = require('./routes/otpRoutes');

const app = express();

app.use(express.json());

// Mount OTP routes
app.use('/api/otp', otpRoutes);

// ... other routes and middleware
```

---

## 🎨 Frontend Implementation

### 1. API Service

```javascript
// services/otpService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class OtpService {
  /**
   * Send OTP
   */
  static async sendOtp(identifier, identifierType, purpose) {
    try {
      const response = await axios.post(`${API_BASE_URL}/otp/send`, {
        identifier,
        identifierType,
        purpose
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send OTP' };
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOtp(identifier, otp, purpose) {
    try {
      const response = await axios.post(`${API_BASE_URL}/otp/verify`, {
        identifier,
        otp,
        purpose
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify OTP' };
    }
  }

  /**
   * Resend OTP
   */
  static async resendOtp(identifier, identifierType, purpose) {
    try {
      const response = await axios.post(`${API_BASE_URL}/otp/resend`, {
        identifier,
        identifierType,
        purpose
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend OTP' };
    }
  }
}

export default OtpService;
```

---

### 2. OTP Input Component (React)

```jsx
// components/OtpInput.jsx
import React, { useState, useRef, useEffect } from 'react';
import './OtpInput.css';

const OtpInput = ({ length = 6, onComplete, disabled = false }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    
    // Handle single digit input
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Call onComplete when all digits are filled
    const otpString = newOtp.join('');
    if (otpString.length === length) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1].focus();
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    if (isNaN(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp([...newOtp, ...new Array(length - newOtp.length).fill('')]);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastIndex].focus();

    // Call onComplete if full OTP pasted
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="otp-input-container">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="otp-input"
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default OtpInput;
```

```css
/* components/OtpInput.css */
.otp-input-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.otp-input {
  width: 50px;
  height: 50px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
}

.otp-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.otp-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .otp-input {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .otp-input-container {
    gap: 6px;
  }
}
```

---

### 3. OTP Verification Page (React)

```jsx
// pages/OtpVerification.jsx
import React, { useState, useEffect } from 'react';
import OtpInput from '../components/OtpInput';
import OtpService from '../services/otpService';
import './OtpVerification.css';

const OtpVerification = ({ identifier, identifierType, purpose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpComplete = async (otp) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await OtpService.verifyOtp(identifier, otp, purpose);
      
      if (response.success) {
        setSuccess('OTP verified successfully!');
        
        // Store token if provided
        if (response.data?.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        
        // Call success callback
        setTimeout(() => {
          onSuccess(response.data);
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await OtpService.resendOtp(identifier, identifierType, purpose);
      
      if (response.success) {
        setSuccess('OTP resent successfully!');
        setTimer(60);
        setCanResend(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <h2>Verify OTP</h2>
        <p className="otp-subtitle">
          Enter the OTP sent to{' '}
          <strong>
            {identifierType === 'mobile' 
              ? `+91 ${identifier}` 
              : identifier}
          </strong>
        </p>

        <OtpInput
          length={6}
          onComplete={handleOtpComplete}
          disabled={loading}
        />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="resend-section">
          {!canResend ? (
            <p className="timer-text">
              Resend OTP in <strong>{timer}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="resend-button"
            >
              Resend OTP
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpVerification;
```

```css
/* pages/OtpVerification.css */
.otp-verification-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.otp-verification-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.otp-verification-card h2 {
  margin-bottom: 10px;
  color: #333;
  font-size: 28px;
}

.otp-subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
}

.resend-section {
  margin-top: 30px;
}

.timer-text {
  color: #666;
  font-size: 14px;
}

.resend-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
}

.resend-button:hover:not(:disabled) {
  color: #764ba2;
  text-decoration: underline;
}

.resend-button:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.loading-spinner {
  margin-top: 20px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .otp-verification-card {
    padding: 30px 20px;
  }
  
  .otp-verification-card h2 {
    font-size: 24px;
  }
}
```

---

### 4. Complete Login Flow Example

```jsx
// pages/Login.jsx
import React, { useState } from 'react';
import OtpVerification from './OtpVerification';
import OtpService from '../services/otpService';
import './Login.css';

const Login = () => {
  const [step, setStep] = useState('input'); // 'input' or 'verify'
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Validate mobile
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const response = await OtpService.sendOtp(mobile, 'mobile', 'login');
      
      if (response.success) {
        setStep('verify');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (data) => {
    // Redirect to dashboard or home
    window.location.href = '/dashboard';
  };

  if (step === 'verify') {
    return (
      <OtpVerification
        identifier={mobile}
        identifierType="mobile"
        purpose="login"
        onSuccess={handleVerificationSuccess}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <p className="login-subtitle">Enter your mobile number to continue</p>

        <form onSubmit={handleSendOtp}>
          <div className="input-group">
            <label>Mobile Number</label>
            <div className="mobile-input-wrapper">
              <span className="country-code">+91</span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="send-otp-button">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

---

## 🔒 Security Best Practices

### 1. **OTP को Hash करके Store करें**
- Plain text में OTP कभी store न करें
- bcrypt या similar hashing algorithm use करें

### 2. **Rate Limiting Implement करें**
- Same number/email से बार-बार OTP request को block करें
- IP-based rate limiting भी add करें

### 3. **OTP Expiry Time Set करें**
- 5-10 minutes का expiry time ideal है
- Expired OTPs को database से auto-delete करें

### 4. **Maximum Attempts Limit**
- 3-5 attempts के बाद OTP को invalidate करें
- New OTP request करने के लिए force करें

### 5. **HTTPS Use करें**
- Production में हमेशा HTTPS use करें
- OTP transmission को encrypt करें

### 6. **Brute Force Protection**
- Account lockout mechanism implement करें
- Suspicious activity को log करें

### 7. **OTP को Log न करें**
- Production में OTP को console/logs में print न करें
- Development में भी सावधानी बरतें

### 8. **Strong OTP Generation**
- Cryptographically secure random number generator use करें
- Predictable patterns avoid करें

### 9. **One-Time Use**
- Verify होने के बाद OTP को immediately delete करें
- Same OTP को दोबारा use न होने दें

### 10. **IP & Device Tracking**
- Suspicious locations से requests को flag करें
- Device fingerprinting consider करें

---

## ✅ Testing Checklist

### Functional Testing
- [ ] OTP successfully generate हो रहा है
- [ ] SMS/Email में OTP receive हो रहा है
- [ ] Valid OTP verify हो रहा है
- [ ] Invalid OTP reject हो रहा है
- [ ] Expired OTP reject हो रहा है
- [ ] Maximum attempts के बाद block हो रहा है
- [ ] Resend OTP काम कर रहा है
- [ ] Rate limiting काम कर रहा है

### Security Testing
- [ ] OTP database में hashed है
- [ ] HTTPS enabled है
- [ ] Rate limiting effective है
- [ ] Brute force attacks block हो रहे हैं
- [ ] SQL injection protected है
- [ ] XSS attacks protected हैं

### UX Testing
- [ ] Mobile number validation काम कर रहा है
- [ ] Auto-focus next input काम कर रहा है
- [ ] Paste functionality काम कर रहा है
- [ ] Timer countdown display हो रहा है
- [ ] Error messages clear हैं
- [ ] Loading states proper हैं

### Edge Cases
- [ ] Network failure handle हो रहा है
- [ ] SMS gateway failure handle हो रहा है
- [ ] Duplicate requests handle हो रहे हैं
- [ ] Concurrent requests handle हो रहे हैं
- [ ] Database connection errors handle हो रहे हैं

---

## 🐛 Common Issues & Solutions

### Issue 1: OTP SMS नहीं आ रहा
**Possible Causes:**
- SMS gateway credentials गलत हैं
- Mobile number format गलत है
- SMS gateway का balance खत्म हो गया
- DND (Do Not Disturb) enabled है

**Solutions:**
- Gateway credentials verify करें
- Mobile number format check करें (+91 prefix)
- Gateway dashboard में balance check करें
- Transactional SMS template use करें

---

### Issue 2: OTP Verification Failed
**Possible Causes:**
- OTP expire हो गया
- Wrong OTP entered
- Database में OTP नहीं मिल रहा
- Hashing issue

**Solutions:**
- Expiry time check करें
- OTP comparison logic verify करें
- Database query check करें
- bcrypt.compare() properly use करें

---

### Issue 3: Rate Limiting Not Working
**Possible Causes:**
- Middleware properly configured नहीं है
- Redis connection issue (if using Redis)
- Key generation logic गलत है

**Solutions:**
- Middleware order check करें
- Redis connection verify करें
- Custom key generator test करें

---

### Issue 4: Multiple OTPs Generate हो रहे हैं
**Possible Causes:**
- Previous OTPs delete नहीं हो रहे
- Duplicate requests handle नहीं हो रहे

**Solutions:**
- sendOtp में पहले previous OTPs delete करें
- Request deduplication implement करें

---

### Issue 5: Auto-delete Not Working
**Possible Causes:**
- TTL index properly set नहीं है
- MongoDB version issue

**Solutions:**
- `expires` field properly set करें
- Manual cleanup cron job add करें

---

## 📊 Performance Optimization

### 1. **Database Indexing**
```javascript
// Proper indexes for fast queries
otpSchema.index({ identifier: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 });
```

### 2. **Redis Caching**
```javascript
// Store OTPs in Redis instead of MongoDB for faster access
const redis = require('redis');
const client = redis.createClient();

// Set OTP with expiry
await client.setex(`otp:${identifier}:${purpose}`, 600, otpHash);

// Get OTP
const otpHash = await client.get(`otp:${identifier}:${purpose}`);
```

### 3. **Async SMS Sending**
```javascript
// Send SMS asynchronously using queue (Bull/BullMQ)
const Queue = require('bull');
const smsQueue = new Queue('sms-queue');

// Add to queue
await smsQueue.add({ mobile, otp });

// Process queue
smsQueue.process(async (job) => {
  await SmsService.sendViaMSG91(job.data.mobile, job.data.otp);
});
```

---

## 🎯 Summary

### Key Points to Remember:
1. **Security First** - OTP को हमेशा hash करके store करें
2. **Rate Limiting** - Abuse prevent करने के लिए जरूरी है
3. **Expiry Time** - 5-10 minutes ideal है
4. **User Experience** - Clear error messages और smooth flow
5. **Testing** - सभी edge cases test करें
6. **Monitoring** - Logs और analytics track करें

### Production Checklist:
- [ ] Environment variables properly set हैं
- [ ] HTTPS enabled है
- [ ] Rate limiting configured है
- [ ] Error handling robust है
- [ ] Logging implemented है
- [ ] Monitoring setup है
- [ ] Backup SMS gateway configured है
- [ ] Security audit complete है

---

## 📚 Additional Resources

### SMS Gateways (India)
- **MSG91** - https://msg91.com/
- **Twilio** - https://www.twilio.com/
- **Fast2SMS** - https://www.fast2sms.com/
- **TextLocal** - https://www.textlocal.in/
- **Kaleyra** - https://www.kaleyra.com/

### Email Services
- **SendGrid** - https://sendgrid.com/
- **AWS SES** - https://aws.amazon.com/ses/
- **Mailgun** - https://www.mailgun.com/
- **Postmark** - https://postmarkapp.com/

### Libraries
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens
- **express-rate-limit** - Rate limiting
- **nodemailer** - Email sending
- **twilio** - SMS sending
- **redis** - Caching

---

**Created by:** Antigravity AI Assistant  
**Last Updated:** February 11, 2026  
**Version:** 1.0.0
