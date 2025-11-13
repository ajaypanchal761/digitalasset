const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const configureCloudinary = require('../config/cloudinary');

const cloudinary = configureCloudinary();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.body.folder || 'digital-assets';

    return {
      folder,
      resource_type: 'image',
      format: undefined,
      public_id: undefined,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  },
});

module.exports = upload;

