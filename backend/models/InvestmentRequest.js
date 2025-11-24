import mongoose from 'mongoose';

const investmentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  amountInvested: {
    type: Number,
    required: [true, 'Investment amount is required'],
    min: [500000, 'Minimum investment is ₹5,00,000'],
  },
  timePeriod: {
    type: Number,
    required: [true, 'Investment period is required'],
    min: [3, 'Minimum investment period is 3 months'],
  },
  transactionProof: {
    type: String,
    required: [true, 'Transaction proof is required'],
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const InvestmentRequest = mongoose.model('InvestmentRequest', investmentRequestSchema);

export default InvestmentRequest;

