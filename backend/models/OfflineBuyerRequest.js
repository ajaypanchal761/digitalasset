import mongoose from 'mongoose';

const offlineBuyerRequestSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  holdingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Holding',
    required: true,
  },
  buyerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  buyerName: {
    type: String,
    required: true,
    trim: true,
  },
  buyerPhone: {
    type: String,
    required: true,
    trim: true,
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  transferCompletedDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
offlineBuyerRequestSchema.index({ sellerId: 1, status: 1 });
offlineBuyerRequestSchema.index({ buyerEmail: 1, status: 1 });
offlineBuyerRequestSchema.index({ holdingId: 1 });
offlineBuyerRequestSchema.index({ propertyId: 1 });

const OfflineBuyerRequest = mongoose.model('OfflineBuyerRequest', offlineBuyerRequestSchema);

export default OfflineBuyerRequest;

