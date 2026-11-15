// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    // read role and lot fresh from the DB, so a deleted account or changed lot applies instantly
    const user = await User.findById(decoded.id).select('name role lot');
    if (!user || !['admin', 'staff'].includes(user.role)) {
      return res.status(401).json({ error: 'Account not found' });
    }
    if (user.role === 'staff' && !user.lot) {
      return res.status(403).json({ error: 'Staff account has no lot assigned' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// usage: router.post('/x', requireRole('staff', 'admin'), handler)
export function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) =>
      roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ error: 'Not allowed for your role' }),
  ];
}

export const requireAdmin = requireRole('admin');

// which lot is this request allowed to touch?
// staff: always their own lot (anything the client sends is ignored)
// admin: whatever lotId they pass
export function getActingLotId(req) {
  if (req.user.role === 'staff') return req.user.lot.toString();
  const fromClient = req.body?.lotId ?? req.query?.lotId;
  return fromClient ? String(fromClient) : null;
}