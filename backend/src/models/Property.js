import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a property title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String, // Cloudinary URL
  },
  propertyType: {
    type: String,
    default: 'Digital Property',
  },
  minInvestment: {
    type: Number,
    default: 500000, // ₹5 lakh
    required: true,
  },
  lockInMonths: {
    type: Number,
    default: 3,
    required: true,
  },
  monthlyReturnRate: {
    type: Number,
    default: 0.5, // 0.5%
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  availableToInvest: {
    type: Number,
    required: true,
  },
  totalInvested: {
    type: Number,
    default: 0,
  },
  investorCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active',
  },
  documents: [{
    type: String, // Array of document URLs
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
});

const Property = mongoose.model('Property', propertySchema);

export default Property;



