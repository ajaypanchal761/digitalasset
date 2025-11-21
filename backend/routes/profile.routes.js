import express from 'express';
import {
  getProfile,
  updateProfile,
  submitKYC,
  updateBankDetails,
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadKYCDocuments } from '../middleware/upload.js';

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/kyc', protect, uploadKYCDocuments, submitKYC);
router.put('/bank-details', protect, updateBankDetails);

export default router;


