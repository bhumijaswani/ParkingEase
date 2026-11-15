// services/lotService.js
import { Lot } from '../models/Lot.js';
import { Slot } from '../models/Slot.js';

const TYPES = ['car', 'bike', 'ev', 'disabled'];

export async function getAreas() {
  const areas = await Lot.distinct('area');
  return areas.sort((a, b) => a.localeCompare(b));
}

export async function getLotsWithAvailability(area) {
  const lots = await Lot.find({ area }).sort({ name: 1 }).lean();
  if (lots.length === 0) return [];

  const now = new Date();

  // one query: count total and free slots per (lot, type)
  // free = physically empty AND (not held OR hold already expired)
  const rows = await Slot.aggregate([
    { $match: { lot: { $in: lots.map((l) => l._id) } } },
    {
      $group: {
        _id: { lot: '$lot', type: '$type' },
        total: { $sum: 1 },
        free: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$occupancy', 'FREE'] },
                  {
                    $or: [
                      { $ne: ['$reservation.status', 'RESERVED'] },
                      { $lt: ['$reservation.reservedUntil', now] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const byLot = new Map();
  for (const row of rows) {
    const key = row._id.lot.toString();
    if (!byLot.has(key)) byLot.set(key, {});
    byLot.get(key)[row._id.type] = { total: row.total, free: row.free };
  }

  return lots.map((lot) => {
    const found = byLot.get(lot._id.toString()) || {};
    const availability = {};
    // always return all 4 types, so the UI never has to guess
    for (const type of TYPES) availability[type] = found[type] || { total: 0, free: 0 };
    return {
      id: lot._id,
      name: lot.name,
      area: lot.area,
      address: lot.address,
      location: lot.location,
      availability,
    };
  });
}