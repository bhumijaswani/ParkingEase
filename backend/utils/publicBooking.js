// utils/publicBooking.js

// what the outside world is allowed to see of a booking (no phone number)
export function toPublicBooking(booking, lot = booking.lot) {
  // the cleanup job runs once a minute, so work out the real status here
  const expired = booking.status === 'ACTIVE' && booking.expiresAt < new Date();
  return {
    id: booking._id,
    status: expired ? 'EXPIRED' : booking.status,
    vehicleNumber: booking.vehicleNumber,
    vehicleType: booking.vehicleType,
    slotNumber: booking.slotNumber,
    expiresAt: booking.expiresAt,
    lot:
      lot && lot.name
        ? { id: lot._id, name: lot.name, area: lot.area, address: lot.address }
        : null,
  };
}