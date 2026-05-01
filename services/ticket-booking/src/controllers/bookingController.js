const axios = require('axios');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { publishEvent } = require('../config/kafka');

/**
 * Validate and sanitize a MongoDB ObjectId to prevent URL path injection.
 * Returns the hex string if valid, otherwise throws.
 */
function sanitizeObjectId(value, fieldName) {
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return str;
}

/** Allowed booking statuses (whitelist) */
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

/**
 * Sanitise a query-string value to a plain string.
 * Rejects objects/arrays that could carry NoSQL operators like { $gt: "" }.
 */
function sanitizeQueryString(value) {
  if (typeof value !== 'string') return undefined;
  return value;
}

const SEAT_SVC = process.env.SEAT_AVAILABILITY_URL || 'http://localhost:3002';
const TRAIN_SVC = process.env.TRAIN_MANAGEMENT_URL  || 'http://localhost:3001';

// GET /api/bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    const filter = {};

    const email = sanitizeQueryString(req.query.email);
    if (email) filter.contactEmail = email.toLowerCase();

    const status = sanitizeQueryString(req.query.status);
    if (status) {
      const upper = status.toUpperCase();
      if (VALID_STATUSES.includes(upper)) {
        filter.status = upper;
      }
    }

    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, total, page, data: bookings });
  } catch (err) { next(err); }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'bookingId');
    const booking = await Booking.findById(id).lean();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// GET /api/bookings/ref/:reference
exports.getBookingByReference = async (req, res, next) => {
  try {
    const reference = sanitizeQueryString(req.params.reference);
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Invalid booking reference' });
    }
    const booking = await Booking.findOne({ bookingReference: reference.toUpperCase() }).lean();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// POST /api/bookings  — main orchestration: validate → reserve seat → save booking → publish event
exports.createBooking = async (req, res, next) => {
  try {
    const { scheduleId: rawScheduleId, trainId: rawTrainId, seatClass, passengers, contactEmail, journeyDate, origin, destination } = req.body;
    const scheduleId = sanitizeObjectId(rawScheduleId, 'scheduleId');
    const trainId = sanitizeObjectId(rawTrainId, 'trainId');
    const seatCount = passengers.length;

    // 1. Verify schedule exists via Train Management Service
    let scheduleInfo;
    try {
      const { data } = await axios.get(`${TRAIN_SVC}/api/schedules/${scheduleId}`, { timeout: 5000 });
      scheduleInfo = data.data;
      if (scheduleInfo.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'This schedule has been cancelled' });
      }
    } catch (scheduleErr) {
      console.error('[ticket-booking] Schedule verification failed:', scheduleErr.message);
      return res.status(502).json({ success: false, message: 'Could not verify schedule with Train Management Service' });
    }

    // 2. Check and reserve seats via Seat Availability Service
    let reservedSeats;
    try {
      const { data } = await axios.put(
        `${SEAT_SVC}/api/seats/${scheduleId}/reserve`,
        { bookingId: 'TEMP', seatClass, seatCount, passengerId: contactEmail },
        { timeout: 5000 }
      );
      reservedSeats = data.data.reservedSeats;
    } catch (seatErr) {
      const msg = seatErr.response?.data?.message || 'Seat reservation failed';
      return res.status(seatErr.response?.status || 502).json({ success: false, message: msg });
    }

    // 3. Calculate fare based on distance × pricePerKm × passengers
    const classInfo = scheduleInfo.trainId?.classes?.find(c => c.className === seatClass);
    const pricePerKm = classInfo?.pricePerKm || 2.5;
    const totalAmount = Number.parseFloat((scheduleInfo.distanceKm * pricePerKm * seatCount).toFixed(2));

    // 4. Assign seat numbers to passengers
    const passengersWithSeats = passengers.map((p, i) => ({
      ...p,
      seatNumber: reservedSeats[i]?.seatNumber,
    }));

    // 5. Create booking record
    const booking = await Booking.create({
      scheduleId,
      trainId,
      seatClass,
      passengers: passengersWithSeats,
      totalAmount,
      contactEmail: contactEmail.toLowerCase(),
      journeyDate,
      origin,
      destination,
      status: 'CONFIRMED',
    });

    // 6. Update the temp reservation with real bookingId
    try {
      await axios.put(`${SEAT_SVC}/api/seats/${scheduleId}/reserve`, {
        bookingId: booking._id.toString(),
        seatClass,
        seatCount: 0, // already reserved, just updating reference
      }, { timeout: 3000 });
    } catch (updateErr) {
      console.warn('[ticket-booking] Seat reference update failed (non-critical):', updateErr.message);
    }

    // 7. Publish booking.created event → consumed by Notification Service
    await publishEvent('booking.created', {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      contactEmail: booking.contactEmail,
      passengers: booking.passengers.map(p => ({ name: p.name, email: p.email, seatNumber: p.seatNumber })),
      origin: booking.origin,
      destination: booking.destination,
      journeyDate: booking.journeyDate,
      seatClass: booking.seatClass,
      totalAmount: booking.totalAmount,
      scheduleId: booking.scheduleId,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// DELETE /api/bookings/:id  — cancel booking, release seats, publish event
exports.cancelBooking = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'bookingId');
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status.toLowerCase()}` });
    }

    // 1. Release seats
    try {
      await axios.put(`${SEAT_SVC}/api/seats/${booking.scheduleId}/release`, {
        bookingId: booking._id.toString(),
        seatClass: booking.seatClass,
        seatCount: booking.passengers.length,
      }, { timeout: 5000 });
    } catch (releaseErr) {
      console.warn('[ticket-booking] Seat release failed (non-fatal):', releaseErr.message);
    }

    // 2. Update booking status
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || 'User requested cancellation';
    await booking.save();

    // 3. Publish cancellation event → Notification + Seat Availability consumers
    await publishEvent('booking.cancelled', {
      bookingId: booking._id.toString(),
      bookingReference: booking.bookingReference,
      scheduleId: booking.scheduleId.toString(),
      seatClass: booking.seatClass,
      seatCount: booking.passengers.length,
      contactEmail: booking.contactEmail,
      totalAmount: booking.totalAmount,
    });

    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (err) { next(err); }
};
