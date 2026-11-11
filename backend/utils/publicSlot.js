// utils/publicSlot.js
export function toPublicSlot(slot) {
  return {
    _id: slot._id,
    slotNumber: slot.slotNumber,
    zone: slot.zone,
    type: slot.type,
    distanceFromEntry: slot.distanceFromEntry,
    occupancy: slot.occupancy,
    reservation: {
      status: slot.reservation?.status ?? 'NONE',
      reservedFrom: slot.reservation?.reservedFrom ?? null,
      reservedUntil: slot.reservation?.reservedUntil ?? null,
    },
  };
}