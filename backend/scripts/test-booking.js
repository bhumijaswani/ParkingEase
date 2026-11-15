// scripts/test-booking.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { Lot } from '../models/Lot.js';
import { Slot } from '../models/Slot.js';
import { Booking } from '../models/Booking.js';
import {
  reserveSlot,
  cancelBooking,
  releaseExpiredReservations,
  RELEASE_RESERVATION,
} from '../services/bookingService.js';

const TEST_VEHICLES = ['DL1AB1001', 'DL1AB1002', 'DL1AB1003', 'DL1AB1004', 'DL1AB1005', 'DL1AB1006'];
const phone = '9876543210';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const lot = await Lot.findOne({ area: 'Rohini', name: 'Parking C' });
  if (!lot) throw new Error('Run seed.js first');

  // clean start so the script can be re-run
  await Booking.deleteMany({ vehicleNumber: { $in: TEST_VEHICLES } });
  await Slot.updateMany({ lot: lot._id }, RELEASE_RESERVATION);

  console.log('\n1) Normal car booking');
  const r1 = await reserveSlot({ lotId: lot._id.toString(), vehicleType: 'car', vehicleNumber: 'DL1AB1001', phoneNumber: phone });
  console.log('   booked slot:', r1.slot.slotNumber, '| expires:', r1.booking.expiresAt.toISOString());

  console.log('\n2) Same vehicle books again (should fail)');
  await reserveSlot({ lotId: lot._id.toString(), vehicleType: 'car', vehicleNumber: 'DL1AB1001', phoneNumber: phone })
    .then(() => console.log('   UNEXPECTED SUCCESS'))
    .catch((e) => console.log('   rejected:', e.message));

  console.log('\n3) EV in a lot with no EV slots (should fail)');
  await reserveSlot({ lotId: lot._id.toString(), vehicleType: 'ev', vehicleNumber: 'DL1AB1002', phoneNumber: phone })
    .then(() => console.log('   UNEXPECTED SUCCESS'))
    .catch((e) => console.log('   rejected:', e.message));

  console.log('\n4) Concurrency: 5 users, 1 accessible slot');
  const results = await Promise.allSettled(
    ['DL1AB1002', 'DL1AB1003', 'DL1AB1004', 'DL1AB1005', 'DL1AB1006'].map((v) =>
      reserveSlot({ lotId: lot._id.toString(), vehicleType: 'disabled', vehicleNumber: v, phoneNumber: phone })
    )
  );
  const wins = results.filter((r) => r.status === 'fulfilled');
  console.log('   succeeded:', wins.length, '(expected 1)');
  results.filter((r) => r.status === 'rejected').forEach((r) => console.log('   rejected:', r.reason.message));

  console.log('\n5) Cancel booking 1, slot should free up');
  const c = await cancelBooking(r1.booking._id);
  console.log('   booking:', c.booking.status, '| slot reservation:', c.slot.reservation.status);

  console.log('\n6) Expiry job');
  const r6 = await reserveSlot({ lotId: lot._id.toString(), vehicleType: 'bike', vehicleNumber: 'DL1AB1001', phoneNumber: phone });
  const past = new Date(Date.now() - 60 * 1000);
  await Booking.updateOne({ _id: r6.booking._id }, { expiresAt: past });
  await Slot.updateOne({ _id: r6.slot._id }, { 'reservation.reservedUntil': past });
  const released = await releaseExpiredReservations();
  const after = await Booking.findById(r6.booking._id);
  console.log('   slots released:', released.length, '| booking:', after.status);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});