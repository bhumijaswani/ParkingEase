// services/authService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from '../models/User.js';
import { Lot } from '../models/Lot.js';

const TOKEN_EXPIRY = '8h';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function publicUser(user) {
  let lot = null;
  if (user.lot && user.lot.name) {
    lot = { id: user.lot._id, name: user.lot.name, area: user.lot.area };
  } else if (user.lot) {
    lot = { id: user.lot };
  }
  return { id: user._id, name: user.name, email: user.email, role: user.role, lot };
}

// not exposed as a route anymore: the seed script uses it to create the first admin
export async function registerAdmin({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, passwordHash, role: 'admin' });
  return publicUser(admin);
}

// only an admin can call this (see authRoutes)
export async function registerStaff({ name, email, password, lotId }) {
  if (!name || !email || !password || !lotId) {
    throw new Error('name, email, password and lotId are required');
  }
  const lot = await Lot.findById(String(lotId));
  if (!lot) throw new Error('Lot not found');
  if (await User.findOne({ email: String(email).toLowerCase() })) {
    throw new Error('An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const staff = await User.create({ name, email, passwordHash, role: 'staff', lot: lot._id });
  await staff.populate('lot', 'name area');
  return publicUser(staff);
}

async function loginWithRole(role, { email, password }) {
  const user = await User.findOne({
    email: String(email ?? '').trim().toLowerCase(), // String() so an object can't become a Mongo operator
    role,
  }).populate('lot', 'name area');

  const ok = user && (await bcrypt.compare(String(password ?? ''), user.passwordHash));
  if (!ok) throw new Error('Invalid email or password');

  return { token: signToken(user), user: publicUser(user) };
}

export const loginAdmin = (creds) => loginWithRole('admin', creds);
export const loginStaff = (creds) => loginWithRole('staff', creds);