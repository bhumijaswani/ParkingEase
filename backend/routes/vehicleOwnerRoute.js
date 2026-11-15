// routes/vehicleOwnerRoutes.js
import express from 'express';
import {
  handleVehicleOwnerRegister,
  handleFindVehicleOwner,
} from '../controllers/vehicleOwnerController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', requireRole('staff', 'admin'), handleVehicleOwnerRegister);
router.get('/:vehicleNumber', requireRole('staff', 'admin'), handleFindVehicleOwner);

export default router;