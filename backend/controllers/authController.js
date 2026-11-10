// controllers/authController.js
import { registerAdmin, loginAdmin } from '../services/authService.js';
export async function handleAdminRegister(req, res) {
  try {
    const { name, email, password } = req.body;
    const admin = await registerAdmin({ name, email, password });
    res.status(201).json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleAdminLogin(req, res) {
  try {
    const { email, password } = req.body;
    const result = await loginAdmin({ email, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}