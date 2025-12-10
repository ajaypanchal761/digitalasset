import express from 'express';
import { generateCertificate } from '../controllers/certificate.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All certificate routes require authentication
router.use(protect);

router.get('/:holdingId', generateCertificate);

export default router;

