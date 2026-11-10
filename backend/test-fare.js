import { calculateDurationMinutes, calculateFare } from './services/fareService.js';

const rate = { firstHourRate: 20, additionalHourRate: 10 };

const checkIn = new Date('2026-10-01T10:00:00');
const checkOut = new Date('2026-10-01T12:15:00'); // 2 ghante 15 minute

const duration = calculateDurationMinutes(checkIn, checkOut);
const fare = calculateFare(duration, rate);

console.log('Duration (minutes):', duration); // 135
console.log('Fare:', fare); // hours = ceil(135/60) = 3 → 20 + 2*10 = 40