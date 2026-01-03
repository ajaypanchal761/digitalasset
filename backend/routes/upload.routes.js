import express from 'express';
import {
  uploadImage,
  uploadDocument,
} from '../controllers/upload.controller.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';
import { uploadImage as uploadImageMiddleware, uploadDocument as uploadDocumentMiddleware } from '../middleware/upload.js';

const router = express.Router();

router.post('/image', adminProtect, uploadImageMiddleware, uploadImage);
router.post('/document', adminProtect, uploadDocumentMiddleware, uploadDocument);

export default router;


