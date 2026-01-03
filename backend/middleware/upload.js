import multer from 'multer';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary storage for images (with transformations)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'digitalasset/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

// Configure Cloudinary storage for documents (no transformations)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'digitalasset/documents',
    allowed_formats: ['pdf'],
    // No transformation for PDFs to prevent corruption
  },
});

// Configure multer for images
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Configure multer for documents
const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for documents'), false);
    }
  },
});

// Upload single image
export const uploadImage = imageUpload.single('image');

// Upload multiple images
export const uploadImages = imageUpload.array('images', 5);

// Upload document
export const uploadDocument = documentUpload.single('document');

// Upload multiple documents
export const uploadDocuments = documentUpload.array('documents', 10);

// Upload transaction proof (images only)
export const uploadTransactionProof = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG) are allowed for transaction proof'), false);
    }
  },
}).single('document');

// Upload KYC documents (multiple named fields - images only)
export const uploadKYCDocuments = imageUpload.fields([
  { name: 'panCard', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
]);


