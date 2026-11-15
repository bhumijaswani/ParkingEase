// routes/authRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  handleAdminLogin,
  handleStaffLogin,
  handleStaffRegister,
} from '../controllers/authController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30, // slows down password guessing
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

router.post('/admin/login', loginLimiter, handleAdminLogin);
router.post('/staff/login', loginLimiter, handleStaffLogin);
router.post('/staff/register', requireRole('admin'), handleStaffRegister);

export default router;