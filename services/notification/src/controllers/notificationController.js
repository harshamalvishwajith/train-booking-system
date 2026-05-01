const mongoose = require('mongoose');
const Notification = require('../models/Notification');

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

const VALID_TYPES = new Set(['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'SCHEDULE_CHANGED', 'REMINDER']);
const VALID_STATUSES = new Set(['SENT', 'FAILED', 'PENDING']);

// GET /api/notifications
exports.getAllNotifications = async (req, res, next) => {
  try {
    const filter = {};
    const email = sanitizeQueryString(req.query.email);
    if (email) filter.recipientEmail = email.toLowerCase();

    const type = sanitizeQueryString(req.query.type);
    if (type) {
      const upper = type.toUpperCase();
      if (VALID_TYPES.has(upper)) filter.type = upper;
    }

    const status = sanitizeQueryString(req.query.status);
    if (status) {
      const upper = status.toUpperCase();
      if (VALID_STATUSES.has(upper)) filter.status = upper;
    }

    const page  = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ success: true, total, page, data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/booking/:bookingId
exports.getByBookingId = async (req, res, next) => {
  try {
    const bookingId = sanitizeObjectId(req.params.bookingId, 'bookingId');
    const notifications = await Notification.find({ bookingId })
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
