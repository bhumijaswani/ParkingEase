// controllers/vehicleOwnerController.js
import { registerVehicleOwner, findVehicleOwnerByNumber } from '../services/vehicleOwnerService.js';

export async function handleVehicleOwnerRegister(req, res) {
  try {
    const { name, phoneNumber, vehicleNumber, vehicleType } = req.body;
    const owner = await registerVehicleOwner({ name, phoneNumber, vehicleNumber, vehicleType });
    res.status(201).json(owner);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleFindVehicleOwner(req, res) {
  try {
    const { vehicleNumber } = req.params;
    const owner = await findVehicleOwnerByNumber(vehicleNumber);
    if (!owner) return res.status(404).json({ error: 'Not registered' });
    res.status(200).json(owner);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}