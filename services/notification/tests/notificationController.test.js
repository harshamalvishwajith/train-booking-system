const notificationController = require('../src/controllers/notificationController');
const Notification = require('../src/models/Notification');
const mongoose = require('mongoose');

jest.mock('../src/models/Notification');

describe('notificationController', () => {
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

  describe('getAllNotifications', () => {
    it('should return notifications with valid queries', async () => {
      req.query = { email: 'TEST@example.com', type: 'BOOKING_CONFIRMED', status: 'SENT', page: '1', limit: '10' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '1' }])
      };
      Notification.find.mockReturnValue(mockQuery);
      Notification.find().merge = jest.fn().mockReturnThis();
      Notification.find().countDocuments = jest.fn().mockResolvedValue(1);

      await notificationController.getAllNotifications(req, res, next);
      
      expect(mockQuery.equals).toHaveBeenCalledWith('test@example.com');
      expect(mockQuery.equals).toHaveBeenCalledWith('BOOKING_CONFIRMED');
      expect(mockQuery.equals).toHaveBeenCalledWith('SENT');
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, page: 1, data: [{ _id: '1' }] });
    });

    it('should handle invalid queries', async () => {
      req.query = { type: 'INVALID', status: 'INVALID' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      Notification.find.mockReturnValue(mockQuery);
      Notification.find().merge = jest.fn().mockReturnThis();
      Notification.find().countDocuments = jest.fn().mockResolvedValue(0);

      await notificationController.getAllNotifications(req, res, next);
      
      expect(mockQuery.where).not.toHaveBeenCalledWith('type');
      expect(mockQuery.where).not.toHaveBeenCalledWith('status');
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 0, page: 1, data: [] });
    });

    it('should handle errors', async () => {
      Notification.find.mockImplementation(() => { throw new Error('DB Error'); });
      await notificationController.getAllNotifications(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getByBookingId', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params.bookingId = 'invalid';
      await notificationController.getByBookingId(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return notifications by bookingId', async () => {
      req.params.bookingId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '1' }])
      };
      Notification.find.mockReturnValue(mockQuery);
      await notificationController.getByBookingId(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, data: [{ _id: '1' }] });
    });
  });

  describe('getById', () => {
    it('should return 400 for invalid id', async () => {
      req.params.id = 'invalid';
      await notificationController.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Notification.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      await notificationController.getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return notification if found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Notification.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: req.params.id })
      });
      await notificationController.getById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      Notification.aggregate.mockResolvedValue([{ _id: { type: 'BOOKING_CONFIRMED', status: 'SENT' }, count: 5 }]);
      await notificationController.getStats(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle errors', async () => {
      Notification.aggregate.mockRejectedValue(new Error('DB Error'));
      await notificationController.getStats(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
