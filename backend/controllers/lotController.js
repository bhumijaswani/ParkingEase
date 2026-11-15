// controllers/lotController.js
import { getAreas, getLotsWithAvailability } from '../services/lotService.js';

export async function handleGetAreas(req, res) {
  try {
    res.json(await getAreas());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleGetLots(req, res) {
  try {
    // .toString() so a sneaky ?area[$ne]=x can't become a Mongo operator
    const area = (req.query.area ?? '').toString().trim();
    if (!area) return res.status(400).json({ error: 'area query parameter is required' });
    res.json(await getLotsWithAvailability(area));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}