import HelpArticle from '../models/HelpArticle.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import Admin from '../models/Admin.js';

// Helper function to optionally check if user is admin
const checkAdminOptional = async (req) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    return admin;
  } catch (error) {
    return null;
  }
};

// @desc    Get all help articles (public)
// @route   GET /api/help-articles
// @access  Public
export const getAllHelpArticles = async (req, res) => {
  try {
    const { category, search, status } = req.query;

    // Check if user is admin (optional - won't fail if not admin)
    const adminUser = await checkAdminOptional(req);
    const isAdmin = !!adminUser;
    
    // Build query
    // For public users: only show active articles
    // For admin users: show all articles by default (unless filtered)
    const query = {};
    
    // Only filter by status if:
    // 1. User is not admin (public users only see active)
    // 2. User is admin and status filter is explicitly provided
    if (!isAdmin) {
      query.status = 'active';
    } else if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const articles = await HelpArticle.find(query)
      .populate('relatedArticles', 'title category description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error('Error fetching help articles:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single help article (public)
// @route   GET /api/help-articles/:id
// @access  Public
export const getHelpArticle = async (req, res) => {
  try {
    const article = await HelpArticle.findById(req.params.id)
      .populate('relatedArticles', 'title category description iconComponent');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // Only show active articles to public
    if (article.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error fetching help article:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get popular help articles
// @route   GET /api/help-articles/popular
// @access  Public
export const getPopularHelpArticles = async (req, res) => {
  try {
    const articles = await HelpArticle.find({ 
      status: 'active',
      isPopular: true 
    })
      .sort({ createdAt: -1 })
      .limit(4);

    res.json({
      success: true,
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    console.error('Error fetching popular help articles:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create help article (admin only)
// @route   POST /api/help-articles
// @access  Admin
export const createHelpArticle = async (req, res) => {
  try {
    const { title, category, description, content, iconComponent, relatedArticles, isPopular } = req.body;

    // Validate required fields
    if (!title || !category || !description || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, description, and content',
      });
    }

    const articleData = {
      title,
      category,
      description,
      content,
      iconComponent: iconComponent || category,
      isPopular: isPopular || false,
      createdBy: req.user.id,
    };

    if (relatedArticles && Array.isArray(relatedArticles)) {
      articleData.relatedArticles = relatedArticles;
    }

    const article = await HelpArticle.create(articleData);

    // Populate related articles
    await article.populate('relatedArticles', 'title category description');

    res.status(201).json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error creating help article:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update help article (admin only)
// @route   PUT /api/help-articles/:id
// @access  Admin
export const updateHelpArticle = async (req, res) => {
  try {
    const { title, category, description, content, iconComponent, relatedArticles, isPopular, status } = req.body;

    const article = await HelpArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    // Update fields
    if (title) article.title = title;
    if (category) article.category = category;
    if (description) article.description = description;
    if (content) article.content = content;
    if (iconComponent) article.iconComponent = iconComponent;
    if (typeof isPopular === 'boolean') article.isPopular = isPopular;
    if (status) article.status = status;
    if (relatedArticles && Array.isArray(relatedArticles)) {
      article.relatedArticles = relatedArticles;
    }

    await article.save();
    await article.populate('relatedArticles', 'title category description iconComponent');

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error updating help article:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete help article (admin only)
// @route   DELETE /api/help-articles/:id
// @access  Admin
export const deleteHelpArticle = async (req, res) => {
  try {
    const article = await HelpArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found',
      });
    }

    await HelpArticle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting help article:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

