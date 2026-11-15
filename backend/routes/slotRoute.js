// routes/slotRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import { Slot } from '../models/Slot.js';
import { requireRole, getActingLotId } from '../middleware/authMiddleware.js';
import { toPublicSlot } from '../utils/publicSlot.js';
import { getLotSummary } from '../services/slotService.js';

const router = express.Router();

function actingLot(req, res) {
  const lotId = getActingLotId(req);
  if (!lotId || !mongoose.isValidObjectId(lotId)) {
    res.status(400).json({ error: 'lotId is required' });
    return null;
  }
  return new mongoose.Types.ObjectId(lotId);
}

router.get('/', requireRole('staff', 'admin'), async (req, res) => {
  try {
    const lotId = actingLot(req, res);
    if (!lotId) return;
    const slots = await Slot.find({ lot: lotId }).sort({ zone: 1, slotNumber: 1 });
    res.json(slots.map(toPublicSlot));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', requireRole('staff', 'admin'), async (req, res) => {
  try {
    const lotId = actingLot(req, res);
    if (!lotId) return;
    res.json(await getLotSummary(lotId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;