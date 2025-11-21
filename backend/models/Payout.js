import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  holdingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Holding',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  payoutDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  nextPayoutDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'failed'],
    default: 'pending',
  },
  processedAt: {
    type: Date,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  failureReason: {
    type: String,
  },
  month: {
    type: Number, // 1-12
    required: true,
  },
  year: {
    type: Number, // e.g., 2025
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
payoutSchema.index({ userId: 1, status: 1 });
payoutSchema.index({ holdingId: 1 });
payoutSchema.index({ payoutDate: 1 });
payoutSchema.index({ status: 1, payoutDate: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;

