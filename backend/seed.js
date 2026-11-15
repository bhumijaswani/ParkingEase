// seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { Lot } from './models/Lot.js';
import { Slot } from './models/Slot.js';
import { Rate } from './models/Rate.js';
import { Session } from './models/Session.js';
import { Booking } from './models/Booking.js';
import bcrypt from 'bcryptjs';

import { User } from './models/User.js';
import { registerAdmin } from './services/authService.js';

const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'staff1234';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin1234';
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-');
// [longitude, latitude], approximate area centres (sample data)
const AREAS = [
  { name: 'Rohini', center: [77.113, 28.741] },
  { name: 'Model Town', center: [77.193, 28.716] },
  { name: 'Mukherjee Nagar', center: [77.207, 28.707] },
  { name: 'Karol Bagh', center: [77.191, 28.651] },
  { name: 'Chandni Chowk', center: [77.230, 28.651] },
  { name: 'Connaught Place', center: [77.217, 28.632] },
  { name: 'Khan Market', center: [77.227, 28.600] },
  { name: 'Paschim Vihar', center: [77.100, 28.670] },
  { name: 'Rajouri Garden', center: [77.122, 28.649] },
  { name: 'Janakpuri', center: [77.088, 28.622] },
  { name: 'Dwarka', center: [77.046, 28.592] },
  { name: 'Vasant Kunj', center: [77.158, 28.520] },
  { name: 'Saket', center: [77.207, 28.525] },
  { name: 'Hauz Khas', center: [77.200, 28.549] },
  { name: 'Lajpat Nagar', center: [77.243, 28.568] },
  { name: 'Nehru Place', center: [77.252, 28.549] },
  { name: 'Greater Kailash', center: [77.239, 28.548] },
  { name: 'Laxmi Nagar', center: [77.277, 28.630] },
  { name: 'Mayur Vihar', center: [77.297, 28.609] },
  { name: 'Shahdara', center: [77.289, 28.670] },
];

// every area gets these 4 lots; offset is in degrees (about 300 m)
// capacity per type = how many slots of that type get created
const LOT_TEMPLATES = [
  { name: 'Parking A', offset: [0.003, 0.002], capacity: { car: 10, bike: 8, ev: 2, disabled: 2 } },
  { name: 'Parking B', offset: [-0.003, 0.002], capacity: { car: 15, bike: 10, ev: 4, disabled: 3 } },
  { name: 'Parking C', offset: [0.003, -0.003], capacity: { car: 6, bike: 6, ev: 0, disabled: 1 } },
  { name: 'Parking D', offset: [-0.003, -0.003], capacity: { car: 8, bike: 5, ev: 3, disabled: 2 } },
];

const TYPE_CONFIG = {
  car: { prefix: 'C', zone: 'Car Bay', baseDistance: 10, step: 5 },
  bike: { prefix: 'B', zone: 'Bike Bay', baseDistance: 5, step: 3 },
  ev: { prefix: 'E', zone: 'EV Bay', baseDistance: 8, step: 4 },
  disabled: { prefix: 'D', zone: 'Accessible Bay', baseDistance: 3, step: 2 },
};

const ratesData = [
  { vehicleType: 'car', firstHourRate: 20, additionalHourRate: 10 },
  { vehicleType: 'bike', firstHourRate: 10, additionalHourRate: 5 },
  { vehicleType: 'ev', firstHourRate: 25, additionalHourRate: 12 },
  { vehicleType: 'disabled', firstHourRate: 15, additionalHourRate: 8 },
];

const round = (n) => Number(n.toFixed(5));

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Sessions are cleared too, otherwise old ACTIVE sessions point to deleted slots
    await Promise.all([
    Session.deleteMany({}),
    Booking.deleteMany({}),
    Slot.deleteMany({}),
    Lot.deleteMany({}),
    Rate.deleteMany({}),
  ]);
  console.log('Old sessions, bookings, slots, lots and rates cleared');

  await Promise.all([
    Slot.syncIndexes(),
    Lot.syncIndexes(),
    Session.syncIndexes(),
    Booking.syncIndexes(),
  ]);

  await User.deleteMany({ role: 'staff' }); // staff point at lots, which were just rebuilt
  const staffHash = await bcrypt.hash(STAFF_PASSWORD, 10); // hashed once, reused for every staff account
  const staffDocs = [];

  await Rate.insertMany(ratesData);

  const allSlots = [];
  let lotCount = 0;

  for (const area of AREAS) {
    for (const tpl of LOT_TEMPLATES) {
      const lot = await Lot.create({
        name: tpl.name,
        area: area.name,
        address: `${tpl.name}, ${area.name} (sample)`,
        location: {
          type: 'Point',
          coordinates: [
            round(area.center[0] + tpl.offset[0]),
            round(area.center[1] + tpl.offset[1]),
          ],
        },
      });
      lotCount++;

      staffDocs.push({
        name: `${area.name} ${tpl.name} Staff`,
        email: `${slug(area.name)}.${tpl.name.split(' ')[1].toLowerCase()}@parkease.test`,
        passwordHash: staffHash,
        role: 'staff',
        lot: lot._id,
      });

      for (const [type, count] of Object.entries(tpl.capacity)) {
        const cfg = TYPE_CONFIG[type];
        for (let i = 1; i <= count; i++) {
          allSlots.push({
            lot: lot._id,
            slotNumber: `${cfg.prefix}-${i}`,
            zone: cfg.zone,
            type,
            distanceFromEntry: cfg.baseDistance + (i - 1) * cfg.step,
          });
        }
      }
    }
  }

  await Slot.insertMany(allSlots);
  console.log(`Seeded ${AREAS.length} areas, ${lotCount} lots, ${allSlots.length} slots`);

  await User.insertMany(staffDocs);
  const ADMIN_EMAIL = 'admin@parkease.test';
  if (!(await User.findOne({ email: ADMIN_EMAIL }))) {
    await registerAdmin({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    console.log(`Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }
  console.log(`Created ${staffDocs.length} staff accounts`);
  console.log(`Demo staff login: rohini.a@parkease.test / ${STAFF_PASSWORD}`);

  await mongoose.disconnect();
  console.log('Done, disconnected');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});