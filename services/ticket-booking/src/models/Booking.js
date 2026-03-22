const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  nationalId: { type: String, trim: true },
  age: { type: Number, min: 0 },
  seatNumber: String,
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    unique: true,
    default: () => `BK-${uuidv4().slice(0, 8).toUpperCase()}`,
  },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  trainId: { type: mongoose.Schema.Types.ObjectId, required: true },
  seatClass: {
    type: String,
    enum: ['FIRST', 'SECOND', 'THIRD'],
    required: true,
  },
  passengers: { type: [passengerSchema], required: true, validate: v => v.length > 0 },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING',
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID', 'REFUNDED'],
    default: 'UNPAID',
  },
  contactEmail: { type: String, required: true },
  journeyDate: { type: Date, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  cancelledAt: Date,
  cancelReason: String,
}, { timestamps: true });

bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ contactEmail: 1 });
bookingSchema.index({ scheduleId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
