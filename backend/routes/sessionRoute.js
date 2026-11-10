// routes/sessionRoutes.js
import express from 'express';
import { handleCheckIn, handleInitiateCheckout, handleConfirmPayment } from '../controllers/sessionController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', requireAdmin, handleCheckIn);
router.post('/initiate-checkout', requireAdmin, handleInitiateCheckout);
router.post('/confirm-payment', requireAdmin, handleConfirmPayment);

export default router;