import express from 'express';
import {
  getHoldings,
  getHolding,
  createHolding,
} from '../controllers/holding.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getHoldings);
router.get('/:id', protect, getHolding);
router.post('/', protect, createHolding);

export default router;


