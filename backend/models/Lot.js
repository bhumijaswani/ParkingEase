// models/Lot.js
import mongoose from 'mongoose';

const lotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Parking A"
    area: { type: String, required: true, trim: true }, // "Rohini"
    address: { type: String, trim: true },
    // GeoJSON point, optional for now, used by the nearby search later
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined }, // [longitude, latitude]
    },
  },
  { timestamps: true }
);

// same lot name can't repeat within an area
lotSchema.index({ area: 1, name: 1 }, { unique: true });
lotSchema.index({ location: '2dsphere' });

export const Lot = mongoose.model('Lot', lotSchema);