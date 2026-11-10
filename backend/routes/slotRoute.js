import express from 'express';
import { Slot } from '../models/Slot.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const total = await Slot.countDocuments();
    const occupied = await Slot.countDocuments({ occupancy: 'OCCUPIED' });
    const free = total - occupied;
    res.json({ total, occupied, free });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;