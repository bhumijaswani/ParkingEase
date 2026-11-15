// routes/lotRoutes.js
import express from 'express';
import { handleGetAreas, handleGetLots } from '../controllers/lotController.js';

const router = express.Router();

router.get('/areas', handleGetAreas);
router.get('/lots', handleGetLots);

export default router;