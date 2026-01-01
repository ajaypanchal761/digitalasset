import express from 'express';
import {
  getProfile,
  updateProfile,
  submitKYC,
  updateBankDetails,
  verifyPan,
  sendAadhaarOtp,
  verifyAadhaarOtp,
  verifyBank
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadKYCDocuments } from '../middleware/upload.js';

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/kyc', protect, uploadKYCDocuments, submitKYC);
router.put('/bank-details', protect, updateBankDetails);
router.post('/verify-pan', protect, verifyPan);
router.post('/aadhaar-otp', protect, sendAadhaarOtp);
router.post('/verify-aadhaar-otp', protect, verifyAadhaarOtp);
router.post('/verify-bank', protect, verifyBank);

export default router;


