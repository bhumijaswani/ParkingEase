// models/Slot.js
import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true, // jaise "A-12" — koi do slots same number ke nahi ho sakte
    },
    zone: {
      type: String,
      required: true, // jaise "A", "B" — floor/section
    },
    type: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
      default: 'car',
    },
    distanceFromEntry: {
      type: Number,
      required: true, // recommendation engine scoring ke liye use hoga
    },
    occupancy: {
      type: String,
      enum: ['FREE', 'OCCUPIED'],
      default: 'FREE', // yeh batata hai vehicle PHYSICALLY hai ya nahi
    },
    reservation: {
      status: {
        type: String,
        enum: ['NONE', 'RESERVED'],
        default: 'NONE',
      },
      reservedFrom: { type: Date },
      reservedUntil: { type: Date },
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null, //  active session ID will be 
    },
  },
  { timestamps: true } // createdAt/updatedAt apne aap add ho jayenge
);

export const Slot = mongoose.model('Slot', slotSchema);