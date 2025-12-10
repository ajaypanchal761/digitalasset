import mongoose from 'mongoose';

const helpArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an article title'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['KYC', 'Investment', 'Wallet', 'Withdrawal', 'Account', 'Technical', 'Getting Started'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide article content'],
  },
  iconComponent: {
    type: String,
    default: 'Help',
    enum: ['KYC', 'Investment', 'Wallet', 'Withdrawal', 'Account', 'Technical', 'Getting Started', 'Help'],
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpArticle',
  }],
  isPopular: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
});

const HelpArticle = mongoose.model('HelpArticle', helpArticleSchema);

export default HelpArticle;

