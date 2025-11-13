const { Router } = require('express');
const healthRouter = require('./health.routes');
const uploadRouter = require('./upload.routes');

const router = Router();

router.use('/health', healthRouter);
router.use('/uploads', uploadRouter);

module.exports = router;

