// controllers/sessionController.js
import { checkInWalkIn, initiateCheckout, confirmPayment } from '../services/sessionService.js';
import { broadcastSlotChange } from '../socket.js';
import { getActingLotId } from '../middleware/authMiddleware.js';

export async function handleCheckIn(req, res) {
  try {
    const lotId = getActingLotId(req);
    if (!lotId) return res.status(400).json({ error: 'lotId is required' });

    const { name, phoneNumber, vehicleNumber, vehicleType } = req.body;
    const result = await checkInWalkIn({ lotId, name, phoneNumber, vehicleNumber, vehicleType });
    await broadcastSlotChange(result.slot);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleInitiateCheckout(req, res) {
  try {
    // staff: always their own lot. admin: optional lotId, otherwise any lot
    const lotId = getActingLotId(req) || undefined;
    res.json(await initiateCheckout({ vehicleNumber: req.body.vehicleNumber, lotId }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleConfirmPayment(req, res) {
  try {
    const lotId = getActingLotId(req) || undefined;
    const { vehicleNumber, paymentMethod } = req.body;
    const result = await confirmPayment({ vehicleNumber, paymentMethod, lotId });
    await broadcastSlotChange(result.slot);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}