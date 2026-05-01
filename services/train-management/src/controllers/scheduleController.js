const Schedule = require('../models/Schedule');
const Train = require('../models/Train');

/**
 * Escape special regex characters in a string to prevent ReDoS attacks.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/schedules?origin=&destination=&date=
exports.searchSchedules = async (req, res, next) => {
  try {
    const { origin, destination, date } = req.query;
    const filter = {};
    if (origin) filter.origin = new RegExp(escapeRegExp(origin), 'i');
    if (destination) filter.destination = new RegExp(escapeRegExp(destination), 'i');
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date);   end.setHours(23, 59, 59, 999);
      filter.journeyDate = { $gte: start, $lte: end };
    }
    filter.status = { $ne: 'CANCELLED' };

    const schedules = await Schedule.find(filter)
      .populate('trainId', 'trainNumber name type classes')
      .lean();
    res.json({ success: true, total: schedules.length, data: schedules });
  } catch (err) { next(err); }
};

// GET /api/schedules/:id
exports.getScheduleById = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('trainId').lean();
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};

// POST /api/schedules
exports.createSchedule = async (req, res, next) => {
  try {
    const { trainId, journeyDate, origin, destination, departureTime, arrivalTime, distanceKm, stops } = req.body;
    const train = await Train.findById(trainId);
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    const schedule = await Schedule.create({ trainId, journeyDate, origin, destination, departureTime, arrivalTime, distanceKm, stops });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) { next(err); }
};

// PUT /api/schedules/:id/status
exports.updateScheduleStatus = async (req, res, next) => {
  try {
    const { status, delayMinutes } = req.body;
    const update = { status };
    if (delayMinutes !== undefined) update.delayMinutes = delayMinutes;

    const schedule = await Schedule.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) { next(err); }
};
