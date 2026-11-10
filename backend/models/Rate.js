// models/Rate.js
import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'ev', 'disabled'],
      required: true,
      unique: true, // har vehicle type ka sirf ek hi rate entry ho sakta hai
    },
    firstHourRate: {
      type: Number,
      required: true,
    },
    additionalHourRate: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Rate = mongoose.model('Rate', rateSchema);