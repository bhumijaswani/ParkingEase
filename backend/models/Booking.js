// models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    slotNumber: { type: String, required: true }, // snapshot, same idea as Session
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
      required: true,
    },
    phoneNumber: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'FULFILLED'],
      default: 'ACTIVE',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// one ACTIVE booking per vehicle, enforced by the database itself
bookingSchema.index(
  { vehicleNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
bookingSchema.index({ status: 1, expiresAt: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);