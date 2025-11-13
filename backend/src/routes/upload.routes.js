const { Router } = require('express');
const upload = require('../middleware/upload');
const { handleImageUpload } = require('../controllers/upload.controller');

const router = Router();

router.post('/', upload.single('image'), handleImageUpload);

module.exports = router;

