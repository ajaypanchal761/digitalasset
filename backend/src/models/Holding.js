import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema({
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
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  maturityDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['lock-in', 'matured'],
    default: 'lock-in',
  },
  monthlyEarning: {
    type: Number,
    required: true, // amountInvested * 0.005
  },
  totalEarningsReceived: {
    type: Number,
    default: 0,
  },
  lockInMonths: {
    type: Number,
    default: 3,
  },
  canWithdrawInvestment: {
    type: Boolean,
    default: false,
  },
  canWithdrawEarnings: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Holding = mongoose.model('Holding', holdingSchema);

export default Holding;



