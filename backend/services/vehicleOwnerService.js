// services/vehicleOwnerService.js
import { User } from '../models/User.js';

export async function registerVehicleOwner({ name, phoneNumber, vehicleNumber, vehicleType }) {
  const existing = await User.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    role: 'vehicleOwner',
  });

  if (existing) {
    throw new Error('This vehicle is already registered');
  }

  const owner = await User.create({
    name,
    phoneNumber,
    vehicleNumber: vehicleNumber.toUpperCase(),
    vehicleType,
    role: 'vehicleOwner',
  });

  return owner;
}

export async function findVehicleOwnerByNumber(vehicleNumber) {
  return User.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    role: 'vehicleOwner',
  });
}