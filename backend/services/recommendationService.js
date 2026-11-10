// services/recommendationService.js

const WEIGHTS = {
  distance: 0.4,
  availability: 0.3,
  preference: 0.3,
};

function normalizeDistance(distance, maxDistance) {
  if (maxDistance === 0) return 1;
  return 1 - distance / maxDistance;
}

function getAvailabilityScore(slot, requestedDurationMinutes) {
  // agar reserve nahi hai, to poori availability maano
  if (slot.reservation.status !== 'RESERVED') return 1;

  const now = new Date();
  const reservedFrom = new Date(slot.reservation.reservedFrom);
  const minutesUntilReserved = (reservedFrom - now) / (1000 * 60);

  // agar user ki requested duration khatam hone se pehle hi reservation shuru ho jaayegi, kam score do
  if (minutesUntilReserved < requestedDurationMinutes) {
    return 0.3; // risky slot
  }
  return 1;
}

function getPreferenceScore(slot, prefs) {
  let score = 0;
  let total = 0;

  if (prefs.preferredZone) {
    total += 1;
    if (slot.zone === prefs.preferredZone) score += 1;
  }

  return total === 0 ? 1 : score / total; // koi preference nahi di to full score do
}

export function recommend(freeSlots, prefs) {
  const {
    vehicleType,
    needsEV = false,
    needsAccessible = false,
    preferredZone = null,
    durationMinutes = 60,
  } = prefs;

  const eligible = freeSlots.filter((slot) => {
    if (slot.type !== vehicleType) {
      if (needsEV && slot.type === 'ev' && vehicleType === 'car') {
      } else {
        return false;
      }
    }
    if (needsAccessible && slot.type !== 'disabled') return false;
    return true;
  });

  if (eligible.length === 0) return [];

  const maxDistance = Math.max(...eligible.map((s) => s.distanceFromEntry));

  // Step 2: scoring
  const scored = eligible.map((slot) => {
    const distanceScore = normalizeDistance(slot.distanceFromEntry, maxDistance);
    const availabilityScore = getAvailabilityScore(slot, durationMinutes);
    const preferenceScore = getPreferenceScore(slot, { preferredZone });

    const score =
      WEIGHTS.distance * distanceScore +
      WEIGHTS.availability * availabilityScore +
      WEIGHTS.preference * preferenceScore;

    const reasons = [];
    if (distanceScore > 0.7) reasons.push('Closest available slot');
    if (slot.type === vehicleType) reasons.push('Suitable for your vehicle');
    if (availabilityScore === 1) reasons.push('Expected to remain available');

    return { slot, score: Math.round(score * 100) / 100, reasons };
  });

  // Step 3: best score pehle
  scored.sort((a, b) => b.score - a.score);
  return scored;
}