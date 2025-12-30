import express from 'express';
import {
  createOfflineBuyerRequest,
  getOfflineBuyerRequests,
} from '../controllers/offlineBuyerRequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', createOfflineBuyerRequest);
router.get('/', getOfflineBuyerRequests);

export default router;

