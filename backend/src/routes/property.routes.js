import express from 'express';
import {
  getAllProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
} from '../controllers/property.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { admin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getAllProperties);
router.get('/:id', getProperty);
router.post('/', protect, admin, createProperty);
router.put('/:id', protect, admin, updateProperty);
router.delete('/:id', protect, admin, deleteProperty);
router.patch('/:id/status', protect, admin, updatePropertyStatus);

export default router;


