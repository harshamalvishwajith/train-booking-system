const mongoose = require('mongoose');
const Train = require('../models/Train');
const { publishEvent } = require('../config/kafka');

/**
 * Validate and sanitize a MongoDB ObjectId.
 * Returns a proper ObjectId instance if valid, otherwise throws a 400 error.
 */
function sanitizeObjectId(value, fieldName) {
  const str = String(value);
  if (!mongoose.Types.ObjectId.isValid(str)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.status = 400;
    throw err;
  }
  return new mongoose.Types.ObjectId(str);
}

/** Allowed train types (whitelist) */
const VALID_TYPES = new Set(['EXPRESS', 'INTERCITY', 'LOCAL', 'NIGHT']);

/**
 * Sanitise a query-string value to a plain string.
 * Rejects objects/arrays that could carry NoSQL operators like { $gt: "" }.
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return undefined;
  return value;
}

// GET /api/trains
exports.getAllTrains = async (req, res, next) => {
  try {
    const isActive = sanitizeString(req.query.isActive);
    const query = Train.find();
    query.where('isActive').equals(isActive !== 'false');

    const type = sanitizeString(req.query.type);
    if (type) {
      const upper = type.toUpperCase();
      if (VALID_TYPES.has(upper)) {
        query.where('type').equals(upper);
      }
    }

    const page  = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const trains = await query
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Train.find().merge(query).countDocuments();
    res.json({ success: true, total, page, data: trains });
  } catch (err) { next(err); }
};

// GET /api/trains/:id
exports.getTrainById = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'trainId');
    const train = await Train.findById(id).lean();
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, data: train });
  } catch (err) { next(err); }
};

// POST /api/trains
exports.createTrain = async (req, res, next) => {
  try {
    const { trainNumber, name, type, totalSeats, classes, amenities } = req.body;
    const train = await Train.create({ trainNumber, name, type, totalSeats, classes, amenities });
    await publishEvent('train.created', { trainId: train._id, trainNumber: train.trainNumber });
    res.status(201).json({ success: true, data: train });
  } catch (err) { next(err); }
};

// PUT /api/trains/:id
exports.updateTrain = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'trainId');
    const { trainNumber, name, type, totalSeats, classes, amenities } = req.body;
    const allowedUpdates = {};
    if (trainNumber !== undefined) allowedUpdates.trainNumber = trainNumber;
    if (name !== undefined) allowedUpdates.name = name;
    if (type !== undefined) allowedUpdates.type = type;
    if (totalSeats !== undefined) allowedUpdates.totalSeats = totalSeats;
    if (classes !== undefined) allowedUpdates.classes = classes;
    if (amenities !== undefined) allowedUpdates.amenities = amenities;

    const train = await Train.findByIdAndUpdate(id, allowedUpdates, {
      new: true, runValidators: true,
    });
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    await publishEvent('train.updated', { trainId: train._id });
    res.json({ success: true, data: train });
  } catch (err) { next(err); }
};

// DELETE /api/trains/:id  (soft delete)
exports.deleteTrain = async (req, res, next) => {
  try {
    const id = sanitizeObjectId(req.params.id, 'trainId');
    const train = await Train.findByIdAndUpdate(
      id, { isActive: false }, { new: true }
    );
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, message: 'Train deactivated' });
  } catch (err) { next(err); }
};
