const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Train = require('../models/Train');

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

const VALID_STATUSES = new Set(['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED']);

// GET /api/schedules?origin=&destination=&date=
exports.searchSchedules = async (req, res, next) => {
  try {
    const filter = { status: { $ne: 'CANCELLED' } };

    const origin = sanitizeQueryString(req.query.origin);
    if (origin) filter.origin = { $eq: origin };

    const destination = sanitizeQueryString(req.query.destination);
    if (destination) filter.destination = { $eq: destination };

    const date = sanitizeQueryString(req.query.date);
    if (date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const start = new Date(parsed); start.setHours(0, 0, 0, 0);
      const end   = new Date(parsed); end.setHours(23, 59, 59, 999);
      filter.journeyDate = { $gte: start, $lte: end };
    }

    const schedules = await Schedule.find(filter)
      .collation({ locale: 'en', strength: 2 })
      .populate('trainId', 'trainNumber name type classes')
      .lean();
    res.json({ success: true, total: schedules.length, data: schedules });
  } catch (err) { next(err); }
};

// GET /api/schedules/:id
exports.getScheduleById = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'scheduleId');
    const schedule = await Schedule.findById(id).populate('trainId').lean();
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};

// POST /api/schedules
exports.createSchedule = async (req, res, next) => {
  try {
    const { trainId: rawTrainId, journeyDate, origin, destination, departureTime, arrivalTime, distanceKm, stops } = req.body;
    const trainId = sanitizeObjectId(rawTrainId, 'trainId');
    const train = await Train.findById(trainId);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const schedule = await Schedule.create({ trainId, journeyDate, origin, destination, departureTime, arrivalTime, distanceKm, stops });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) { next(err); }
};

// PUT /api/schedules/:id/status
exports.updateScheduleStatus = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'scheduleId');
    const { status, delayMinutes } = req.body;
    const update = {};
    if (typeof status === 'string' && VALID_STATUSES.has(status.toUpperCase())) {
      update.status = status.toUpperCase();
    }
    if (typeof delayMinutes === 'number' && Number.isFinite(delayMinutes)) {
      update.delayMinutes = delayMinutes;
    }
    const schedule = await Schedule.findByIdAndUpdate(id, update, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};
