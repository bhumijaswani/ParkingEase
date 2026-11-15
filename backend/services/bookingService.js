// services/bookingService.js
import mongoose from 'mongoose';
import { Lot } from '../models/Lot.js';
import { Slot } from '../models/Slot.js';
import { Booking } from '../models/Booking.js';
import { Session } from '../models/Session.js';

const HOLD_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const VEHICLE_TYPES = ['car', 'bike', 'ev', 'disabled'];
const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// shared update that clears a hold
export const RELEASE_RESERVATION = {
  $set: { 'reservation.status': 'NONE', 'reservation.booking': null },
  $unset: { 'reservation.reservedFrom': '', 'reservation.reservedUntil': '' },
};

// "free" = physically empty AND (not reserved OR reservation already expired)
export function freeSlotFilter(lotId, vehicleType, now) {
  return {
    lot: lotId,
    type: vehicleType,
    occupancy: 'FREE',
    $or: [
      { 'reservation.status': { $ne: 'RESERVED' } },
      { 'reservation.reservedUntil': { $lt: now } },
    ],
  };
}

export async function reserveSlot({ lotId, vehicleType, vehicleNumber, phoneNumber }) {
  const number = (vehicleNumber || '').toUpperCase().replace(/\s/g, '');
  if (!VEHICLE_NUMBER_REGEX.test(number)) throw new Error('Invalid vehicle number');
  if (!PHONE_REGEX.test((phoneNumber || '').trim())) throw new Error('Invalid phone number');
  if (!VEHICLE_TYPES.includes(vehicleType)) throw new Error('Invalid vehicle type');
  if (!mongoose.isValidObjectId(lotId)) throw new Error('Invalid lot');

  const lotObjectId = new mongoose.Types.ObjectId(lotId); // aggregate() doesn't auto-cast
  const lot = await Lot.findById(lotObjectId);
  if (!lot) throw new Error('Lot not found');

  const now = new Date();

  // clear this vehicle's stale holds so they can't block a fresh booking
  await Booking.updateMany(
    { vehicleNumber: number, status: 'ACTIVE', expiresAt: { $lt: now } },
    { $set: { status: 'EXPIRED' } }
  );

  if (await Booking.findOne({ vehicleNumber: number, status: 'ACTIVE' })) {
    throw new Error('This vehicle already has an active booking');
  }
  if (await Session.findOne({ vehicleNumber: number, status: 'ACTIVE' })) {
    throw new Error('This vehicle is already parked');
  }

  const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);
  const bookingId = new mongoose.Types.ObjectId(); // known up front so the slot can store it
  const filter = freeSlotFilter(lotObjectId, vehicleType, now);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 1) pick a random candidate
    const [candidate] = await Slot.aggregate([{ $match: filter }, { $sample: { size: 1 } }]);

    if (!candidate) {
      const total = await Slot.countDocuments({ lot: lotObjectId, type: vehicleType });
      throw new Error(
        total === 0
          ? `This lot has no ${vehicleType} slots`
          : `No free ${vehicleType} slot in this lot right now`
      );
    }

    // 2) claim it atomically; fails if someone got it between steps 1 and 2
    const slot = await Slot.findOneAndUpdate(
      { _id: candidate._id, ...filter },
      {
        $set: {
          'reservation.status': 'RESERVED',
          'reservation.reservedFrom': now,
          'reservation.reservedUntil': expiresAt,
          'reservation.booking': bookingId,
        },
      },
      { returnDocument: 'after' }
    );
    if (!slot) continue; // lost the race, pick another random slot

    try {
      const booking = await Booking.create({
        _id: bookingId,
        lot: lot._id,
        slot: slot._id,
        slotNumber: slot.slotNumber,
        vehicleNumber: number,
        vehicleType,
        phoneNumber: phoneNumber.trim(),
        expiresAt,
      });
      return { booking, slot, lot };
    } catch (err) {
      // booking failed, so give the slot back
      await Slot.findOneAndUpdate(
        { _id: slot._id, 'reservation.booking': bookingId },
        RELEASE_RESERVATION
      );
      if (err.code === 11000) throw new Error('This vehicle already has an active booking');
      throw err;
    }
  }

  throw new Error('Could not reserve a slot, please try again');
}

export async function getBooking(bookingId) {
  if (!mongoose.isValidObjectId(bookingId)) throw new Error('Invalid booking id');
  const booking = await Booking.findById(bookingId)
    .populate('lot', 'name area address')
    .populate('slot', 'slotNumber type zone');
  if (!booking) throw new Error('Booking not found');
  return booking;
}

export async function cancelBooking(bookingId) {
  if (!mongoose.isValidObjectId(bookingId)) throw new Error('Invalid booking id');
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'ACTIVE') {
    throw new Error(`Booking is already ${booking.status.toLowerCase()}`);
  }
  if (booking.expiresAt < new Date()) {
    booking.status = 'EXPIRED';
    await booking.save();
    throw new Error('Booking has already expired');
  }

  booking.status = 'CANCELLED';
  await booking.save();

  // only frees the slot if this booking still owns the hold
  const slot = await Slot.findOneAndUpdate(
    { _id: booking.slot, 'reservation.booking': booking._id },
    RELEASE_RESERVATION,
    { returnDocument: 'after' }
  );
  return { booking, slot };
}

// run on a timer; returns the slots it freed so the caller can broadcast them
export async function releaseExpiredReservations() {
  const now = new Date();

  await Booking.updateMany(
    { status: 'ACTIVE', expiresAt: { $lt: now } },
    { $set: { status: 'EXPIRED' } }
  );

  const expiredFilter = {
    'reservation.status': 'RESERVED',
    'reservation.reservedUntil': { $lt: now },
  };
  const expired = await Slot.find(expiredFilter, '_id');
  if (expired.length === 0) return [];

  const ids = expired.map((s) => s._id);
  await Slot.updateMany({ _id: { $in: ids }, ...expiredFilter }, RELEASE_RESERVATION);
  return Slot.find({ _id: { $in: ids } });
}