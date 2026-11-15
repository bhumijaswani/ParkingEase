// controllers/bookingController.js
import { reserveSlot, getBooking, cancelBooking } from '../services/bookingService.js';
import { broadcastSlotChange } from '../socket.js';
import { toPublicBooking } from '../utils/publicBooking.js';

export async function handleCreateBooking(req, res) {
  try {
    const { lotId, vehicleType, vehicleNumber, phoneNumber } = req.body;
    const { booking, slot, lot } = await reserveSlot({ lotId, vehicleType, vehicleNumber, phoneNumber });
    await broadcastSlotChange(slot); // grids turn this slot amber
    res.status(201).json(toPublicBooking(booking, lot));
  } catch (err) {
    res.status(err.message === 'Lot not found' ? 404 : 400).json({ error: err.message });
  }
}

export async function handleGetBooking(req, res) {
  try {
    const booking = await getBooking(req.params.id);
    res.json(toPublicBooking(booking));
  } catch (err) {
    res.status(err.message === 'Booking not found' ? 404 : 400).json({ error: err.message });
  }
}

export async function handleCancelBooking(req, res) {
  try {
    const { booking, slot } = await cancelBooking(req.params.id);
    if (slot) await broadcastSlotChange(slot); // slot goes back to green
    res.json(toPublicBooking(booking));
  } catch (err) {
    res.status(err.message === 'Booking not found' ? 404 : 400).json({ error: err.message });
  }
}