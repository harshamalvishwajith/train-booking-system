const mongoose = require('mongoose');
const Notification = require('../models/Notification');

function sanitizeObjectId(value, fieldName) {
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return new mongoose.Types.ObjectId(str);
}

function sanitizeString(value) {
  if (typeof value !== 'string') return undefined;
  return value;
}

const VALID_TYPES = new Set(['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'SCHEDULE_CHANGED', 'REMINDER']);
const VALID_STATUSES = new Set(['SENT', 'FAILED', 'PENDING']);

// GET /api/notifications
exports.getAllNotifications = async (req, res, next) => {
  try {
    const query = Notification.find();

    const email = sanitizeString(req.query.email);
    if (email) query.where('recipientEmail').equals(email.toLowerCase());

    const type = sanitizeString(req.query.type);
    if (type) {
      const upper = type.toUpperCase();
      if (VALID_TYPES.has(upper)) query.where('type').equals(upper);
    }

    const status = sanitizeString(req.query.status);
    if (status) {
      const upper = status.toUpperCase();
      if (VALID_STATUSES.has(upper)) query.where('status').equals(upper);
    }

    const page  = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const notifications = await query
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.find().merge(query).countDocuments();

    res.json({ success: true, total, page, data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/booking/:bookingId
exports.getByBookingId = async (req, res, next) => {
  try {
    const bookingId = sanitizeObjectId(req.params.bookingId, 'bookingId');
    const notifications = await Notification.find()
      .where('bookingId').equals(bookingId.toString())
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, total: notifications.length, data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/:id
exports.getById = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'notificationId');
    const notification = await Notification.findById(id).lean();
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
};

// GET /api/notifications/stats
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Notification.aggregate([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};
