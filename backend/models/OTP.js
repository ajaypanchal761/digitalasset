import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: function() {
      return !this.email; // Phone required if email not provided
    },
    index: true,
  },
  email: {
    type: String,
    required: function() {
      return !this.phone; // Email required if phone not provided
    },
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password-reset', 'verification'],
    default: 'verification',
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Auto-delete expired OTPs
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 5,
  },
  smsSent: {
    type: Boolean,
    default: false,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  smsMessageId: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster lookups
otpSchema.index({ phone: 1, email: 1, expiresAt: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.isVerified && this.expiresAt > new Date() && this.attempts < this.maxAttempts;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Method to mark as verified
otpSchema.methods.markAsVerified = function() {
  this.isVerified = true;
  this.verifiedAt = new Date();
  return this.save();
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function(phone, email, otp, purpose = 'verification') {
  const query = {
    otp,
    isVerified: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 },
    purpose,
  };

  // Build query - match if phone OR email matches
  const orConditions = [];
  
  if (phone) {
    orConditions.push({ phone });
  }
  if (email) {
    orConditions.push({ email });
  }
  
  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  return this.findOne(query);
};

// Static method to create OTP
otpSchema.statics.createOTP = function(data) {
  return this.create({
    ...data,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

