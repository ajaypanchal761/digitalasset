import mongoose from 'mongoose';

const contactOwnerMessageSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [20, 'Message must be at least 20 characters'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied', 'resolved', 'closed'],
    default: 'pending',
  },
  adminResponse: {
    message: {
      type: String,
      trim: true,
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  adminNotes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
contactOwnerMessageSchema.index({ userId: 1, createdAt: -1 });
contactOwnerMessageSchema.index({ propertyId: 1 });
contactOwnerMessageSchema.index({ status: 1 });

const ContactOwnerMessage = mongoose.model('ContactOwnerMessage', contactOwnerMessageSchema);

export default ContactOwnerMessage;

