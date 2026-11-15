// models/Slot.js
import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lot',
      required: true,
    },
    slotNumber: {
      type: String,
      required: true, // "C-1", unique only within a lot (see index below)
    },
    zone: {
      type: String,
      required: true, // section inside the lot, e.g. "Car Bay"
    },
    type: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
      default: 'car',
    },
    distanceFromEntry: {
      type: Number,
      required: true,
    },
    occupancy: {
      type: String,
      enum: ['FREE', 'OCCUPIED'],
      default: 'FREE',
    },
    reservation: {
      status: {
        type: String,
        enum: ['NONE', 'RESERVED'],
        default: 'NONE',
      },
      reservedFrom: { type: Date },
      reservedUntil: { type: Date },
      // which booking owns this hold, so cancel/expiry never frees someone else's hold
      booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
  },
  { timestamps: true }
);

slotSchema.index({ lot: 1, slotNumber: 1 }, { unique: true });
slotSchema.index({ lot: 1, type: 1, occupancy: 1 }); // availability queries

export const Slot = mongoose.model('Slot', slotSchema);