// services/fareService.js

export function calculateDurationMinutes(checkInTime, checkOutTime) {
  const diffMs = new Date(checkOutTime) - new Date(checkInTime);
  return Math.max(0, Math.round(diffMs / (1000 * 60))); 
}

export function calculateFare(durationMinutes, rate) {
  const { firstHourRate, additionalHourRate } = rate;

  const hours = Math.ceil(durationMinutes / 60); 

  if (hours <= 1) {
    return firstHourRate;
  }

  const extraHours = hours - 1;
  return firstHourRate + extraHours * additionalHourRate;
}