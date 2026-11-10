
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '8h'; // admin ko har 8 ghante baad dobara login karna hoga

export async function registerAdmin({ name, email, password }) {
  const existing = await User.findOne({ email, role: 'admin' });
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: 'admin',
  });
   return { id: admin._id, name: admin.name, email: admin.email };

}
export async function loginAdmin({ email, password }) {
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  return { token, admin: { id: admin._id, name: admin.name, email: admin.email } };
}