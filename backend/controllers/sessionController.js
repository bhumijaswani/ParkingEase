// controllers/sessionController.js
import { checkInWalkIn, initiateCheckout, confirmPayment,checkOut } from '../services/sessionService.js';
import { broadcastSlotChange } from '../socket.js';
// purana handleCheckOut hata ke ye 2 naye:
export async function handleInitiateCheckout(req, res) {
  try {
    const { vehicleNumber } = req.body;
    const result = await initiateCheckout({ vehicleNumber });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleConfirmPayment(req, res) {
  try {
    const { vehicleNumber, paymentMethod } = req.body;
    const result = await confirmPayment({ vehicleNumber, paymentMethod });
    await broadcastSlotChange(result.slot);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleCheckIn(req, res) {
  try {
    const { name, phoneNumber, vehicleNumber, vehicleType } = req.body;
    const result = await checkInWalkIn({ name, phoneNumber, vehicleNumber, vehicleType });
    await broadcastSlotChange(result.slot);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// export async function handleCheckOut(req, res) {
//   try {
//     const { vehicleNumber } = req.body;
//     const result = await checkOut({ vehicleNumber });
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// }