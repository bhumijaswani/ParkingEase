// services/sessionService.js
import { Slot } from '../models/Slot.js';
import { Session } from '../models/Session.js';
import { Rate } from '../models/Rate.js';
import { User } from '../models/User.js';
import { recommend } from './recommendationService.js';
import { calculateDurationMinutes, calculateFare } from './fareService.js';

// ---- Original manual check-in (slotId pehle se pata ho to) ----
export async function checkIn({ vehicleNumber, vehicleType, slotId }) {
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, occupancy: 'FREE' },
    { occupancy: 'OCCUPIED' },
    { new: true }
  );

  if (!slot) {
    throw new Error('Slot is not available (already occupied or does not exist)');
  }

  const session = await Session.create({
    vehicleNumber: vehicleNumber.toUpperCase(),
    vehicleType,
    slot: slot._id,
    slotNumber: slot.slotNumber,
    checkInTime: new Date(),
    status: 'ACTIVE',
  });

  slot.currentSession = session._id;
  await slot.save();

  return { session, slot };
}

// ---- Checkout — dono flows (manual aur walk-in) isi ko use karenge ----
export async function checkOut({ vehicleNumber }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No active session found for this vehicle');
  }

  const checkOutTime = new Date();
  const durationMinutes = calculateDurationMinutes(session.checkInTime, checkOutTime);

  const rate = await Rate.findOne({ vehicleType: session.vehicleType });
  if (!rate) {
    throw new Error(`No rate configured for vehicle type: ${session.vehicleType}`);
  }

  const fare = calculateFare(durationMinutes, rate);

  session.checkOutTime = checkOutTime;
  session.durationMinutes = durationMinutes;
  session.fare = fare;
  session.status = 'COMPLETED';
  await session.save();

  const slot = await Slot.findByIdAndUpdate(
    session.slot,
    { occupancy: 'FREE', currentSession: null },
    { new: true }
  );

  return { session, slot };
}
// purana checkOut tha, ab "initiateCheckout" — session ACTIVE hi rehta hai, sirf fare dikhata hai
export async function initiateCheckout({ vehicleNumber }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No active session found for this vehicle');
  }

  const checkOutTime = new Date();
  const durationMinutes = calculateDurationMinutes(session.checkInTime, checkOutTime);

  const rate = await Rate.findOne({ vehicleType: session.vehicleType });
  if (!rate) {
    throw new Error(`No rate configured for vehicle type: ${session.vehicleType}`);
  }

  const fare = calculateFare(durationMinutes, rate);

  // sirf fare/duration save karo, session abhi ACTIVE hi rahega
  session.durationMinutes = durationMinutes;
  session.fare = fare;
  await session.save();

  return { session };
}

// naya function — payment confirm hone par slot free hoga
export async function confirmPayment({ vehicleNumber, paymentMethod }) {
  const session = await Session.findOne({
    vehicleNumber: vehicleNumber.toUpperCase(),
    status: 'ACTIVE',
  });

  if (!session) {
    throw new Error('No pending checkout found for this vehicle');
  }
  if (!session.fare) {
    throw new Error('Fare not calculated yet. Please initiate checkout first.');
  }

  session.checkOutTime = new Date();
  session.status = 'COMPLETED';
  session.paymentStatus = 'PAID';
  session.paymentMethod = paymentMethod;
  await session.save();

  const slot = await Slot.findByIdAndUpdate(
    session.slot,
    { occupancy: 'FREE', currentSession: null },
    { new: true }
  );

  return { session, slot };
}
// ---- Walk-in check-in: vehicle number se auto owner-lookup + auto slot assign ----
export async function checkInWalkIn({ name, phoneNumber, vehicleNumber, vehicleType }) {
  const upperVehicleNumber = vehicleNumber.toUpperCase();

  // Step 1: Owner dhundo, nahi mila to naya banao
  let owner = await User.findOne({ vehicleNumber: upperVehicleNumber, role: 'vehicleOwner' });
  if (!owner) {
    owner = await User.create({
      name,
      phoneNumber,
      vehicleNumber: upperVehicleNumber,
      vehicleType,
      role: 'vehicleOwner',
    });
  }

  // Step 2: Check karo ye vehicle already andar to nahi hai
  const activeSession = await Session.findOne({
    vehicleNumber: upperVehicleNumber,
    status: 'ACTIVE',
  });
  if (activeSession) {
    throw new Error('This vehicle is already checked in');
  }

  // Step 3: Is vehicle type ke saare free slots nikalo, recommendation se best chuno
  const freeSlots = await Slot.find({ occupancy: 'FREE', type: vehicleType });
  if (freeSlots.length === 0) {
    throw new Error('No free slots available for this vehicle type right now');
  }
  const ranked = recommend(freeSlots, { vehicleType });
  const bestSlot = ranked[0].slot;

  // Step 4: Atomic claim (race condition safe)
  const claimedSlot = await Slot.findOneAndUpdate(
    { _id: bestSlot._id, occupancy: 'FREE' },
    { occupancy: 'OCCUPIED' },
    { new: true }
  );
  if (!claimedSlot) {
    throw new Error('Slot was just taken, please try again');
  }

  // Step 5: Session banao — yahi checkInTime save hota hai
  const session = await Session.create({
    vehicleNumber: upperVehicleNumber,
    vehicleType,
    slot: claimedSlot._id,
    slotNumber: claimedSlot.slotNumber,
    checkInTime: new Date(),
    status: 'ACTIVE',
  });

  claimedSlot.currentSession = session._id;
  await claimedSlot.save();

  return { owner, session, slot: claimedSlot };
}