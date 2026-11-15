// controllers/authController.js
import { registerStaff, loginAdmin, loginStaff } from '../services/authService.js';

export async function handleAdminLogin(req, res) {
  try {
    res.json(await loginAdmin(req.body));
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

export async function handleStaffLogin(req, res) {
  try {
    res.json(await loginStaff(req.body));
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

export async function handleStaffRegister(req, res) {
  try {
    const { name, email, password, lotId } = req.body;
    res.status(201).json(await registerStaff({ name, email, password, lotId }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}