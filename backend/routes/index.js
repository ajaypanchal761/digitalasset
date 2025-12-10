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
import adminAuthRoutes from './adminAuth.routes.js';
import uploadRoutes from './upload.routes.js';
import chatRoutes from './chat.routes.js';
import investmentRequestRoutes from './investmentRequest.routes.js';
import transferRequestRoutes from './transferRequest.routes.js';
import certificateRoutes from './certificate.routes.js';
import helpArticleRoutes from './helpArticle.routes.js';
import contactOwnerRoutes from './contactOwner.routes.js';

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/holdings', holdingRoutes);
router.use('/wallet', walletRoutes);
router.use('/payment', paymentRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/admin-auth', adminAuthRoutes);
router.use('/upload', uploadRoutes);
router.use('/investment-requests', investmentRequestRoutes);
router.use('/transfer-requests', transferRequestRoutes);
router.use('/certificates', certificateRoutes);
router.use('/help-articles', helpArticleRoutes);
router.use('/contact-owner', contactOwnerRoutes);
router.use('/', chatRoutes);

export default router;


