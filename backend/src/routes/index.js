import express from 'express';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Route modules
import authRoutes from './auth.routes.js';
import propertyRoutes from './property.routes.js';
import holdingRoutes from './holding.routes.js';
import walletRoutes from './wallet.routes.js';
import paymentRoutes from './payment.routes.js';
import withdrawalRoutes from './withdrawal.routes.js';
import profileRoutes from './profile.routes.js';
import adminRoutes from './admin.routes.js';
import uploadRoutes from './upload.routes.js';

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/holdings', holdingRoutes);
router.use('/wallet', walletRoutes);
router.use('/payment', paymentRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

export default router;


