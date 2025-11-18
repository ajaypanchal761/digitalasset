import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'digitalasset',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  },
});

// Upload single image
export const uploadImage = upload.single('image');

// Upload multiple images
export const uploadImages = upload.array('images', 5);

// Upload document
export const uploadDocument = upload.single('document');

// Upload multiple documents
export const uploadDocuments = upload.array('documents', 10);


