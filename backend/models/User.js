import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['investor', 'admin'],
    default: 'investor',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'locked', 'suspended', 'deleted'],
    default: 'active',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  kycVerifications: {
    panVerified: { type: Boolean, default: false },
    aadhaarVerified: { type: Boolean, default: false },
    bankVerified: { type: Boolean, default: false },
  },
  kycDocuments: {
    panCard: { type: String, default: null },
    aadhaarCard: { type: String, default: null },
    photo: { type: String, default: null },
    addressProof: { type: String, default: null },
    panNumber: { type: String, default: null },
    aadhaarNumber: { type: String, default: null },
  },
  kycSubmittedAt: { type: Date, default: null },
  kycRejectionReason: { type: String, default: null },
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },
    totalInvestments: {
      type: Number,
      default: 0,
    },
    earningsReceived: {
      type: Number,
      default: 0,
    },
    withdrawableBalance: {
      type: Number,
      default: 0,
    },
    lockedAmount: {
      type: Number,
      default: 0,
    },
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check and auto-approve KYC if all verifications are complete
userSchema.methods.checkAndAutoApproveKYC = function() {
  if (this.kycStatus === 'pending' &&
      this.kycVerifications &&
      this.kycVerifications.panVerified &&
      this.kycVerifications.aadhaarVerified &&
      this.kycVerifications.bankVerified) {
    this.kycStatus = 'approved';
    this.kycSubmittedAt = new Date();
    return true; // Indicates KYC was auto-approved
  }
  return false; // No change
};

// Pre-save hook to ensure kycVerifications exists
userSchema.pre('save', function(next) {
  // Ensure kycVerifications object exists with defaults
  if (!this.kycVerifications) {
    this.kycVerifications = {
      panVerified: false,
      aadhaarVerified: false,
      bankVerified: false
    };
  }
  next();
});

// Post-save hook to process offline buyer requests when KYC is approved
userSchema.post('save', async function(doc) {
  // Only process if KYC status changed to 'approved'
  if (doc.kycStatus === 'approved' && doc.isModified('kycStatus')) {
    try {
      const { processOfflineBuyerRequests } = await import('../services/kycApprovalService.js');
      await processOfflineBuyerRequests(doc._id, doc.email);
    } catch (error) {
      console.error('Error processing offline buyer requests after KYC approval:', error);
      // Don't throw error - KYC approval should still succeed
    }
  }
});

const User = mongoose.model('User', userSchema);

export default User;



