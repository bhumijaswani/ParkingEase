// seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import { Slot } from './models/Slot.js';
import { Rate } from './models/Rate.js';

const slotsData = [
  { slotNumber: 'A-1', zone: 'A', type: 'car', distanceFromEntry: 10 },
  { slotNumber: 'A-2', zone: 'A', type: 'car', distanceFromEntry: 15 },
  { slotNumber: 'A-3', zone: 'A', type: 'car', distanceFromEntry: 20 },
  { slotNumber: 'A-4', zone: 'A', type: 'bike', distanceFromEntry: 12 },
  { slotNumber: 'A-5', zone: 'A', type: 'bike', distanceFromEntry: 18 },
  { slotNumber: 'B-1', zone: 'B', type: 'car', distanceFromEntry: 40 },
  { slotNumber: 'B-2', zone: 'B', type: 'car', distanceFromEntry: 45 },
  { slotNumber: 'B-3', zone: 'B', type: 'ev', distanceFromEntry: 35 },
  { slotNumber: 'B-4', zone: 'B', type: 'disabled', distanceFromEntry: 5 },
  { slotNumber: 'C-1', zone: 'C', type: 'car', distanceFromEntry: 60 },
];

const ratesData = [
  { vehicleType: 'car', firstHourRate: 20, additionalHourRate: 10 },
  { vehicleType: 'bike', firstHourRate: 10, additionalHourRate: 5 },
  { vehicleType: 'ev', firstHourRate: 25, additionalHourRate: 12 },
  { vehicleType: 'disabled', firstHourRate: 15, additionalHourRate: 8 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Slot.deleteMany({});
  await Rate.deleteMany({});
  console.log('Old slots & rates cleared');

  await Slot.insertMany(slotsData);
  await Rate.insertMany(ratesData);
  console.log('Seeded', slotsData.length, 'slots and', ratesData.length, 'rates');

  await mongoose.disconnect();
  console.log('Done, disconnected');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});