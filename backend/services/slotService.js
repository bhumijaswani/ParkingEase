// services/slotService.js
import { Slot } from '../models/Slot.js';

export async function getLotSummary(lotId) {
  const [total, occupied] = await Promise.all([
    Slot.countDocuments({ lot: lotId }),
    Slot.countDocuments({ lot: lotId, occupancy: 'OCCUPIED' }),
  ]);
  return { lot: lotId.toString(), total, occupied, free: total - occupied };
}