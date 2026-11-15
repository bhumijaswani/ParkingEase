// services/sessionService.js
import mongoose from 'mongoose';
import { Slot } from '../models/Slot.js';
import { Session } from '../models/Session.js';
import { Rate } from '../models/Rate.js';
import { User } from '../models/User.js';
import { Lot } from '../models/Lot.js';
import { Booking } from '../models/Booking.js';
import { recommend } from './recommendationService.js';
import { calculateDurationMinutes, calculateFare } from './fareService.js';
import { freeSlotFilter } from './bookingService.js';

const MAX_ATTEMPTS = 5;
const VEHICLE_TYPES = ['car', 'bike', 'ev', 'disabled'];
const PAYMENT_METHODS = ['cash', 'qr'];

// take the slot AND clear any hold on it, in one atomic update
const OCCUPY_AND_CLEAR = {
  $set: { occupancy: 'OCCUPIED', 'reservation.status': 'NONE', 'reservation.booking': null },
  $unset: { 'reservation.reservedFrom': '', 'reservation.reservedUntil': '' },
};

const cleanNumber = (v) => String(v ?? '').toUpperCase().replace(/\s/g, '');

// puts a slot back exactly as it was if something fails after we claimed it
async function undoClaim(slotId, booking) {
  const set = { occupancy: 'FREE', currentSession: null };
  if (booking) {
    set['reservation.status'] = 'RESERVED';
    set['reservation.booking'] = booking._id;
    set['reservation.reservedFrom'] = booking.createdAt;
    set['reservation.reservedUntil'] = booking.expiresAt;
  }
  await Slot.updateOne({ _id: slotId }, { $set: set });
}

// the slot this vehicle booked, claimed only if the hold is still theirs
function claimBookedSlot(booking, lotObjectId) {
  return Slot.findOneAndUpdate(
    { _id: booking.slot, lot: lotObjectId, occupancy: 'FREE', 'reservation.booking': booking._id },
    OCCUPY_AND_CLEAR,
    { returnDocument: 'after' }
  );
}

// walk-in: rank the free slots, then try the best few until one claim wins
async function claimWalkInSlot(lotObjectId, vehicleType) {
  const filter = freeSlotFilter(lotObjectId, vehicleType, new Date());
  const free = await Slot.find(filter); // never includes slots held for someone else
  if (free.length === 0) return null;

  const ranked = recommend(free, { vehicleType });
  for (const { slot } of ranked.slice(0, MAX_ATTEMPTS)) {
    const claimed = await Slot.findOneAndUpdate({ _id: slot._id, ...filter }, OCCUPY_AND_CLEAR, {
      returnDocument: 'after',
    });
    if (claimed) return claimed;
  }
  return null;
}

export async function checkInWalkIn({ lotId, name, phoneNumber, vehicleNumber, vehicleType }) {
  if (!mongoose.isValidObjectId(lotId)) throw new Error('Invalid lot');
  const lotObjectId = new mongoose.Types.ObjectId(lotId);
  if (!(await Lot.exists({ _id: lotObjectId }))) throw new Error('Lot not found');

  const number = cleanNumber(vehicleNumber);
  if (!number) throw new Error('Vehicle number is required');

  if (await Session.findOne({ vehicleNumber: number, status: 'ACTIVE' })) {
    throw new Error('This vehicle is already checked in');
  }

  // does this vehicle hold a booking?
  const now = new Date();
  let booking = await Booking.findOne({ vehicleNumber: number, status: 'ACTIVE' });
  if (booking && booking.expiresAt < now) {
    booking.status = 'EXPIRED';
    await booking.save();
    booking = null;
  }
  if (booking && !booking.lot.equals(lotObjectId)) {
    const other = await Lot.findById(booking.lot, 'name area');
    throw new Error(`This vehicle has a booking at ${other?.name}, ${other?.area}`);
  }

  // owner: reuse the registered one, else validate the new one now and save it after the claim
  const owner = await User.findOne({ vehicleNumber: number, role: 'vehicleOwner' });
  const type = booking?.vehicleType ?? owner?.vehicleType ?? vehicleType;
  if (!VEHICLE_TYPES.includes(type)) throw new Error('Invalid vehicle type');

  const ownerDoc =
    owner ??
    new User({
      name,
      phoneNumber: phoneNumber || booking?.phoneNumber,
      vehicleNumber: number,
      vehicleType: type,
      role: 'vehicleOwner',
    });
  await ownerDoc.validate();

  // claim a slot: the booked one if there is a booking, otherwise the best free one
  let slot = null;
  let source = 'walk-in';
  if (booking) {
    slot = await claimBookedSlot(booking, lotObjectId);
    if (slot) source = 'booking';
    else booking = null; // hold was lost (e.g. cancelled a moment ago), fall back to walk-in
  }
  if (!slot) {
    slot = await claimWalkInSlot(lotObjectId, type);
    if (!slot) {
      const total = await Slot.countDocuments({ lot: lotObjectId, type });
      throw new Error(
        total === 0 ? `This lot has no ${type} slots` : `No free ${type} slot in this lot right now`
      );
    }
  }

  let session;
  try {
    if (!owner) await ownerDoc.save();
    session = await Session.create({
      lot: lotObjectId,
      vehicleNumber: number,
      vehicleType: type,
      slot: slot._id,
      slotNumber: slot.slotNumber,
      checkInTime: new Date(),
      status: 'ACTIVE',
      booking: booking ? booking._id : null,
    });
  } catch (err) {
    await undoClaim(slot._id, booking);
    if (err.code === 11000) throw new Error('This vehicle is already checked in');
    throw err;
  }

  const finalSlot = await Slot.findByIdAndUpdate(
    slot._id,
    { currentSession: session._id },
    { returnDocument: 'after' }
  );
  if (booking) {
    booking.status = 'FULFILLED';
    await booking.save();
  }

  return { owner: ownerDoc, session, slot: finalSlot, source };
}

function activeSessionQuery(vehicleNumber, lotId) {
  const query = { vehicleNumber: cleanNumber(vehicleNumber), status: 'ACTIVE' };
  if (lotId) {
    if (!mongoose.isValidObjectId(lotId)) throw new Error('Invalid lot');
    query.lot = lotId;
  }
  return query;
}

// step 1 of checkout: work out the fare, keep the session ACTIVE
export async function initiateCheckout({ vehicleNumber, lotId }) {
  const session = await Session.findOne(activeSessionQuery(vehicleNumber, lotId));
  if (!session) throw new Error('No active session found for this vehicle at this lot');

  const durationMinutes = calculateDurationMinutes(session.checkInTime, new Date());
  const rate = await Rate.findOne({ vehicleType: session.vehicleType });
  if (!rate) throw new Error(`No rate configured for vehicle type: ${session.vehicleType}`);

  session.durationMinutes = durationMinutes;
  session.fare = calculateFare(durationMinutes, rate);
  await session.save();

  return { session };
}

// step 2: payment received, close the session and free the slot
export async function confirmPayment({ vehicleNumber, paymentMethod, lotId }) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new Error('Invalid payment method');

  // atomic: if two clicks arrive together, only one can close the session
  const session = await Session.findOneAndUpdate(
    { ...activeSessionQuery(vehicleNumber, lotId), fare: { $ne: null } },
    {
      $set: {
        checkOutTime: new Date(),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod,
      },
    },
    { returnDocument: 'after' }
  );
  if (!session) {
    throw new Error('No pending checkout found for this vehicle. Calculate the fare first.');
  }

  const slot = await Slot.findByIdAndUpdate(
    session.slot,
    { occupancy: 'FREE', currentSession: null },
    { returnDocument: 'after' }
  );
  return { session, slot };
}