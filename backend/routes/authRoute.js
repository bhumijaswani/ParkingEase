// routes/authRoutes.js
import express from 'express';
import { handleAdminRegister, handleAdminLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/admin/register', handleAdminRegister);
router.post('/admin/login', handleAdminLogin);

export default router;