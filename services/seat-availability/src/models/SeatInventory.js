const mongoose = require('mongoose');

const reservedSeatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  seatClass: { type: String, enum: ['FIRST', 'SECOND', 'THIRD'], required: true },
  bookingId: { type: String, required: true },
  passengerId: String,
  reservedAt: { type: Date, default: Date.now },
  expiresAt: Date,   // for temporary holds
}, { _id: false });

const seatInventorySchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  trainId: { type: mongoose.Schema.Types.ObjectId, required: true },
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  classSummary: [
    {
      className: { type: String, enum: ['FIRST', 'SECOND', 'THIRD'] },
      total: Number,
      available: Number,
      pricePerKm: Number,
    },
  ],
  reservedSeats: [reservedSeatSchema],
}, { timestamps: true });

seatInventorySchema.index({ scheduleId: 1 });

module.exports = mongoose.model('SeatInventory', seatInventorySchema);
