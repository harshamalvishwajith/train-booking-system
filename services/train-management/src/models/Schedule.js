const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stationName: { type: String, required: true },
  stationCode: { type: String, required: true, uppercase: true },
  arrivalTime: String,
  departureTime: String,
  distanceFromOrigin: { type: Number, default: 0 },
  platform: String,
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  trainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Train',
    required: true,
  },
  journeyDate: { type: Date, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  distanceKm: { type: Number, required: true },
  stops: [stopSchema],
  status: {
    type: String,
    enum: ['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED'],
    default: 'SCHEDULED',
  },
  delayMinutes: { type: Number, default: 0 },
}, { timestamps: true });

scheduleSchema.index({ trainId: 1, journeyDate: 1 });
scheduleSchema.index({ origin: 1, destination: 1, journeyDate: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
