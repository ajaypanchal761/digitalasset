import express from 'express';
import {
  uploadImage,
  uploadDocument,
} from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadImage as uploadImageMiddleware, uploadDocument as uploadDocumentMiddleware } from '../middleware/upload.js';

const router = express.Router();

router.post('/image', protect, uploadImageMiddleware, uploadImage);
router.post('/document', protect, uploadDocumentMiddleware, uploadDocument);

export default router;


