// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
      role: {
      type: String,
      enum: ['admin', 'staff', 'vehicleOwner'],
      required: true,
    },
    // staff only: the one lot they work at
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot' },
    // ---- Admin-only fields ----
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },
    passwordHash: {
      type: String,
    },

    // ---- vehicleOwner-only fields ----
    vehicleNumber: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      unique: true, // ek vehicle number sirf ek vehicleOwner ke naam
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('validate', function () {
  if (this.role === 'admin' || this.role === 'staff') {
    if (!this.email || !this.passwordHash) {
      throw new Error('Admin/staff must have email and password');
    }
  }
  if (this.role === 'staff' && !this.lot) {
    throw new Error('Staff must be assigned to a ParkingLot');
  }
  if (this.role === 'vehicleOwner') {
    if (!this.vehicleNumber || !this.vehicleType || !this.phoneNumber) {
      throw new Error('vehicleOwner must have vehicleNumber, vehicleType, and phoneNumber');
    }
  }
});
export const User = mongoose.model('User', userSchema);