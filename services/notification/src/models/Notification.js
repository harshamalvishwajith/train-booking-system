const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  bookingId:        { type: String, required: true },
  bookingReference: { type: String, required: true },
  recipientEmail:   { type: String, required: true, lowercase: true },
  type: {
    type: String,
    enum: ['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'SCHEDULE_CHANGED', 'REMINDER'],
    required: true,
  },
  subject:      { type: String, required: true },
  payload:      { type: mongoose.Schema.Types.Mixed },   // raw Kafka event data
  status: {
    type: String,
    enum: ['SENT', 'FAILED', 'PENDING'],
    default: 'PENDING',
  },
  errorMessage: String,
  sentAt:       Date,
  retryCount:   { type: Number, default: 0 },
}, { timestamps: true });

notificationSchema.index({ bookingId: 1 });
notificationSchema.index({ recipientEmail: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
