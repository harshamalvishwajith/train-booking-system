const SeatInventory = require('../models/SeatInventory');
const { publishEvent } = require('../config/kafka');

// GET /api/seats/:scheduleId
exports.getSeatAvailability = async (req, res, next) => {
  try {
    const inventory = await SeatInventory.findOne(
      { scheduleId: req.params.scheduleId },
      { reservedSeats: 0 }  // exclude seat details for public endpoint
    ).lean();

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'No seat inventory found for this schedule' });
    }

    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

// POST /api/seats/initialize  - called by ticket-booking after a schedule is created
exports.initializeInventory = async (req, res, next) => {
  try {
    const { scheduleId, trainId, totalSeats, classSummary } = req.body;

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

// PUT /api/seats/:scheduleId/reserve  - called by ticket-booking service
exports.reserveSeat = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { bookingId, seatClass, seatCount = 1, passengerId } = req.body;

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
      newSeats.push({ seatNumber, seatClass, bookingId, passengerId });
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
      bookingId,
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
    const { scheduleId } = req.params;
    const { bookingId, seatClass, seatCount = 1 } = req.body;

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

// GET /api/seats/:scheduleId/detail  - returns full reserved list (internal/admin use)
exports.getSeatDetail = async (req, res, next) => {
  try {
    const inventory = await SeatInventory.findOne({ scheduleId: req.params.scheduleId }).lean();
    if (!inventory) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
};
