import mongoose from 'mongoose';

const propertyTransferRequestSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  buyerId: {
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
  salePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'admin_pending', 'admin_approved', 'admin_rejected', 'completed'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  buyerResponse: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  buyerResponseDate: {
    type: Date,
  },
  adminResponseDate: {
    type: Date,
  },
  transferCompletedDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
propertyTransferRequestSchema.index({ sellerId: 1, status: 1 });
propertyTransferRequestSchema.index({ buyerId: 1, status: 1 });
propertyTransferRequestSchema.index({ holdingId: 1 });

const PropertyTransferRequest = mongoose.model('PropertyTransferRequest', propertyTransferRequestSchema);

export default PropertyTransferRequest;

