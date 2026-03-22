const Train = require('../models/Train');
const { publishEvent } = require('../config/kafka');

// GET /api/trains
exports.getAllTrains = async (req, res, next) => {
  try {
    const { type, isActive = 'true', page = 1, limit = 20 } = req.query;
    const filter = { isActive: isActive === 'true' };
    if (type) filter.type = type.toUpperCase();

    const trains = await Train.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Train.countDocuments(filter);
    res.json({ success: true, total, page: Number(page), data: trains });
  } catch (err) { next(err); }
};

// GET /api/trains/:id
exports.getTrainById = async (req, res, next) => {
  try {
    const train = await Train.findById(req.params.id).lean();
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, data: train });
  } catch (err) { next(err); }
};

// POST /api/trains
exports.createTrain = async (req, res, next) => {
  try {
    const train = await Train.create(req.body);
    await publishEvent('train.created', { trainId: train._id, trainNumber: train.trainNumber });
    res.status(201).json({ success: true, data: train });
  } catch (err) { next(err); }
};

// PUT /api/trains/:id
exports.updateTrain = async (req, res, next) => {
  try {
    const train = await Train.findByIdAndUpdate(req.params.id, req.body, {
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
    const train = await Train.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
    res.json({ success: true, message: 'Train deactivated' });
  } catch (err) { next(err); }
};
