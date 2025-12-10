import express from 'express';
import {
  getAllHelpArticles,
  getHelpArticle,
  getPopularHelpArticles,
  createHelpArticle,
  updateHelpArticle,
  deleteHelpArticle,
} from '../controllers/helpArticle.controller.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// Public routes
router.get('/popular', getPopularHelpArticles);
router.get('/:id', getHelpArticle);
router.get('/', getAllHelpArticles);

// Admin routes (protected)
router.post('/', adminProtect, createHelpArticle);
router.put('/:id', adminProtect, updateHelpArticle);
router.delete('/:id', adminProtect, deleteHelpArticle);

export default router;

