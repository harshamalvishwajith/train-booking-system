const Notification = require('../models/Notification');

// GET /api/notifications
exports.getAllNotifications = async (req, res, next) => {
  try {
    const { email, type, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (email)  filter.recipientEmail = email.toLowerCase();
    if (type)   filter.type = type.toUpperCase();
    if (status) filter.status = status.toUpperCase();

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/booking/:bookingId
exports.getByBookingId = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ bookingId: req.params.bookingId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, total: notifications.length, data: notifications });
  } catch (err) { next(err); }
};

// GET /api/notifications/:id
exports.getById = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id).lean();
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
