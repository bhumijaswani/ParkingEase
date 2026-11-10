// routes/vehicleOwnerRoutes.js
import express from 'express';
import { handleVehicleOwnerRegister, handleFindVehicleOwner } from '../controllers/vehicleOwnerController.js';

const router = express.Router();

router.post('/register', handleVehicleOwnerRegister);
router.get('/:vehicleNumber', handleFindVehicleOwner);

export default router;