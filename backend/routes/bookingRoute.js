// routes/bookingRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  handleCreateBooking,
  handleGetBooking,
  handleCancelBooking,
} from '../controllers/bookingController.js';

const router = express.Router();

// booking needs no login yet, so cap it: otherwise a script could hold every slot
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // per IP per 15 min; raise it while testing if you hit it
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many booking attempts, please try again later' },
});

router.post('/', createLimiter, handleCreateBooking);
router.get('/:id', handleGetBooking);
router.delete('/:id', handleCancelBooking);

export default router;