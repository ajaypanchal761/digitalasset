import express from 'express';
import {
  createContactOwnerMessage,
  getUserContactMessages,
  getContactMessage,
  getPropertyOwnerInfo,
} from '../controllers/contactOwner.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createContactOwnerMessage);
router.get('/', getUserContactMessages);
router.get('/property/:propertyId/owner-info', getPropertyOwnerInfo);
router.get('/:id', getContactMessage);

export default router;

