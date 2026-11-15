// models/Session.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true, // "dl8caf1234" automatically "DL8CAF1234"
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    slotNumber: {
      type: String,
      required: true, // copy rakhte hain taaki slot delete/change ho to bhi history sahi rahe
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null, // sirf checkout ke time calculate hoga
    },
    fare: {
      type: Number,
      default: null, // checkout ke time freeze ho jayega
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
    },
    plateSource: {
      type: String,
      enum: ['manual', 'ocr'],
      default: 'manual', // future OCR scope ke liye abhi se jagah
    },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING',
},
  lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  paymentMethod: {
    type: String,
    enum: ['cash', 'qr', null],
    default: null,
},
  },
  { timestamps: true }
);
sessionSchema.index({ lot: 1, status: 1 });
// one ACTIVE session per vehicle, enforced by the database itself
sessionSchema.index(
  { vehicleNumber: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);

export const Session = mongoose.model('Session', sessionSchema);