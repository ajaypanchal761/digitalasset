import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [1, 'Amount must be greater than 0'],
  },
  type: {
    type: String,
    enum: ['investment', 'earnings'],
    required: true,
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    bankName: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;



