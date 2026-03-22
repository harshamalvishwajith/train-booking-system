const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['EXPRESS', 'INTERCITY', 'LOCAL', 'NIGHT'],
    default: 'EXPRESS',
  },
  totalSeats: { type: Number, required: true, min: 1, max: 1000 },
  classes: [
    {
      className: { type: String, enum: ['FIRST', 'SECOND', 'THIRD'], required: true },
      seatCount: { type: Number, required: true },
      pricePerKm: { type: Number, required: true },
    },
  ],
  amenities: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
