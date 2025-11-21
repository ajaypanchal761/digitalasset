import express from 'express';
import {
  getAllProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  calculateROI,
} from '../controllers/property.controller.js';
import { adminProtect } from '../middleware/adminAuth.middleware.js';

const router = express.Router();

router.get('/', getAllProperties);
router.post('/:id/calculate-roi', calculateROI); // Must come before /:id route
router.get('/:id', getProperty);
router.post('/', adminProtect, createProperty);
router.put('/:id', adminProtect, updateProperty);
router.delete('/:id', adminProtect, deleteProperty);
router.patch('/:id/status', adminProtect, updatePropertyStatus);

export default router;


