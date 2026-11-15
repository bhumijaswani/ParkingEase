// routes/sessionRoutes.js
import express from 'express';
import {
  handleCheckIn,
  handleInitiateCheckout,
  handleConfirmPayment,
} from '../controllers/sessionController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-in', requireRole('staff', 'admin'), handleCheckIn);
router.post('/initiate-checkout', requireRole('staff', 'admin'), handleInitiateCheckout);
router.post('/confirm-payment', requireRole('staff', 'admin'), handleConfirmPayment);

export default router;