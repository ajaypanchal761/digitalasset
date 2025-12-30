import express from 'express';
import {
  createTransferRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
  initiateTransfer,
  cancelTransferRequest,
} from '../controllers/transferRequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', createTransferRequest);
router.get('/received', getReceivedRequests);
router.get('/sent', getSentRequests);
router.put('/:id/respond', respondToRequest);
router.post('/:id/initiate-transfer', initiateTransfer);
router.put('/:id/cancel', cancelTransferRequest);

export default router;

