const scheduleController = require('../src/controllers/scheduleController');
const Schedule = require('../src/models/Schedule');
const Train = require('../src/models/Train');
const mongoose = require('mongoose');

jest.mock('../src/models/Schedule');
jest.mock('../src/models/Train');

describe('scheduleController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('searchSchedules', () => {
    it('should return schedules with successful queries', async () => {
      req.query = { origin: 'A', destination: 'B', date: '2023-12-01' };
      
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        collation: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '1' }])
      };
      Schedule.find.mockReturnValue(mockQuery);

      await scheduleController.searchSchedules(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, data: [{ _id: '1' }] });
    });

    it('should handle invalid date format', async () => {
      req.query = { date: 'invalid-date' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
      };
      Schedule.find.mockReturnValue(mockQuery);

      await scheduleController.searchSchedules(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid date format' });
    });

    it('should handle missing optional queries safely', async () => {
      req.query = { origin: { $gt: '' }, destination: null }; // Test sanitization
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        collation: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '2' }])
      };
      Schedule.find.mockReturnValue(mockQuery);

      await scheduleController.searchSchedules(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, data: [{ _id: '2' }] });
      // origin was object so sanitized to undefined -> shouldn't call where('origin')
    });

    it('should call next on error', async () => {
      Schedule.find.mockImplementation(() => { throw new Error('DB Error'); });
      await scheduleController.searchSchedules(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getScheduleById', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params.id = 'invalid-id';
      await scheduleController.getScheduleById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].status).toBe(400);
    });

    it('should return 404 if schedule not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Schedule.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });
      await scheduleController.getScheduleById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Schedule not found' });
    });

    it('should return schedule if found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      const mockSchedule = { _id: req.params.id };
      Schedule.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSchedule)
      });
      await scheduleController.getScheduleById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockSchedule });
    });
  });

  describe('createSchedule', () => {
    it('should return 400 for invalid trainId', async () => {
      req.body = { trainId: 'invalid-id' };
      await scheduleController.createSchedule(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if train not found', async () => {
      req.body = { trainId: new mongoose.Types.ObjectId().toString() };
      Train.findById.mockResolvedValue(null);
      await scheduleController.createSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Train not found' });
    });

    it('should create and return schedule', async () => {
      req.body = { trainId: new mongoose.Types.ObjectId().toString() };
      Train.findById.mockResolvedValue({ _id: req.body.trainId });
      Schedule.create.mockResolvedValue({ _id: 'schedule-1' });
      await scheduleController.createSchedule(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'schedule-1' } });
    });
  });

  describe('updateScheduleStatus', () => {
    it('should update and return schedule', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { status: 'DELAYED', delayMinutes: 15 };
      Schedule.findByIdAndUpdate.mockResolvedValue({ _id: req.params.id, status: 'DELAYED' });
      await scheduleController.updateScheduleStatus(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: req.params.id, status: 'DELAYED' } });
      expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(expect.any(Object), { status: 'DELAYED', delayMinutes: 15 }, { new: true });
    });

    it('should return 404 if not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { status: 'DELAYED' };
      Schedule.findByIdAndUpdate.mockResolvedValue(null);
      await scheduleController.updateScheduleStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    it('should safely ignore invalid status updates and return updated document', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { status: 'INVALID', delayMinutes: 'not-a-number' };
      Schedule.findByIdAndUpdate.mockResolvedValue({ _id: req.params.id, status: 'SCHEDULED' });
      await scheduleController.updateScheduleStatus(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: req.params.id, status: 'SCHEDULED' } });
      // Validate that empty update object was passed
      expect(Schedule.findByIdAndUpdate).toHaveBeenCalledWith(expect.any(Object), {}, { new: true });
    });

    it('should return 400 for invalid schedule id', async () => {
      req.params.id = 'invalid';
      await scheduleController.updateScheduleStatus(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
