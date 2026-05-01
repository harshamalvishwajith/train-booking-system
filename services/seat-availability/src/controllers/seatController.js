const mongoose = require('mongoose');
const SeatInventory = require('../models/SeatInventory');
const { publishEvent } = require('../config/kafka');

function sanitizeObjectId(value, fieldName) {
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return str;
}

function sanitizeQueryString(value) {
  if (typeof value !== 'string') return undefined;
  return value;
}

// GET /api/seats/:scheduleId
exports.getSeatAvailability = async (req, res, next) => {
  try {
    const scheduleId = sanitizeObjectId(req.params.scheduleId, 'scheduleId');
    const inventory = await SeatInventory.findOne(
      { scheduleId },
      { reservedSeats: 0 }
    ).lean();

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'No seat inventory found for this schedule' });
    }

    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

// POST /api/seats/initialize
exports.initializeInventory = async (req, res, next) => {
  try {
    const { scheduleId: rawScheduleId, trainId: rawTrainId, totalSeats, classSummary } = req.body;
    const scheduleId = sanitizeObjectId(rawScheduleId, 'scheduleId');
    const trainId = sanitizeObjectId(rawTrainId, 'trainId');

    const existing = await SeatInventory.findOne({ scheduleId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Inventory already initialized for this schedule' });
    }

    const inventory = await SeatInventory.create({
      scheduleId,
      trainId,
      totalSeats,
      availableSeats: totalSeats,
      classSummary: classSummary.map(c => ({ ...c, available: c.total })),
    });

    res.status(201).json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

// PUT /api/seats/:scheduleId/reserve
exports.reserveSeat = async (req, res, next) => {
  try {
    const scheduleId = sanitizeObjectId(req.params.scheduleId, 'scheduleId');
    const { bookingId, seatCount = 1, passengerId } = req.body;

    const seatClass = sanitizeQueryString(req.body.seatClass);
    if (!seatClass) {
      return res.status(400).json({ success: false, message: 'seatClass is required' });
    }

    const inventory = await SeatInventory.findOne({ scheduleId });
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Seat inventory not found' });
    }

    // Check class availability
    const classEntry = inventory.classSummary.find(c => c.className === seatClass);
    if (!classEntry || classEntry.available < seatCount) {
      return res.status(409).json({
        success: false,
        message: `Not enough ${seatClass} class seats available`,
        available: classEntry?.available || 0,
      });
    }

    // Assign seat numbers
    const newSeats = [];
    for (let i = 0; i < seatCount; i++) {
      const seatNumber = `${seatClass[0]}${String(classEntry.total - classEntry.available + i + 1).padStart(3, '0')}`;
      newSeats.push({ seatNumber, seatClass, bookingId: String(bookingId), passengerId: String(passengerId) });
    }

    // Atomic update
    const updated = await SeatInventory.findOneAndUpdate(
      { scheduleId, [`classSummary`]: { $elemMatch: { className: seatClass, available: { $gte: seatCount } } } },
      {
        $inc: {
          availableSeats: -seatCount,
          'classSummary.$.available': -seatCount,
        },
        $push: { reservedSeats: { $each: newSeats } },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ success: false, message: 'Seats were taken by another request (race condition avoided)' });
    }

    // Publish seat.updated event
    await publishEvent('seat.updated', {
      scheduleId,
      bookingId: String(bookingId),
      seatClass,
      seatsReserved: newSeats.map(s => s.seatNumber),
      availableSeats: updated.availableSeats,
    });

    res.json({
      success: true,
      data: {
        reservedSeats: newSeats,
        remainingAvailable: updated.availableSeats,
      },
    });
  } catch (err) { next(err); }
};

// PUT /api/seats/:scheduleId/release
exports.releaseSeat = async (req, res, next) => {
  try {
    const scheduleId = sanitizeObjectId(req.params.scheduleId, 'scheduleId');
    const { seatCount = 1 } = req.body;

    const seatClass = sanitizeQueryString(req.body.seatClass);
    const bookingId = String(req.body.bookingId);

    const updated = await SeatInventory.findOneAndUpdate(
      { scheduleId, 'classSummary.className': seatClass },
      {
        $inc: {
          availableSeats: seatCount,
          'classSummary.$.available': seatCount,
        },
        $pull: { reservedSeats: { bookingId } },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Inventory not found' });
    }

    await publishEvent('seat.updated', {
      scheduleId, bookingId, action: 'RELEASED',
      availableSeats: updated.availableSeats,
    });

    res.json({ success: true, message: 'Seats released', availableSeats: updated.availableSeats });
  } catch (err) { next(err); }
};

// GET /api/seats/:scheduleId/detail
exports.getSeatDetail = async (req, res, next) => {
  try {
    const scheduleId = sanitizeObjectId(req.params.scheduleId, 'scheduleId');
    const inventory = await SeatInventory.findOne({ scheduleId }).lean();
    if (!inventory) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
};
