import express from 'express';
import {
  getAdminConversations,
  getChatMessages,
  sendAdminMessage,
  getUserConversations,
  getUserMessages,
  sendUserMessage,
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

// Admin chat routes
router.get('/admin/chat/conversations', adminProtect, getAdminConversations);
router.get('/admin/chat/messages/:userId', adminProtect, getChatMessages);
router.post('/admin/chat/messages/:userId', adminProtect, sendAdminMessage);

// User chat routes
router.get('/chat/conversations', protect, getUserConversations);
router.get('/chat/messages', protect, getUserMessages);
router.post('/chat/messages', protect, sendUserMessage);

export default router;

