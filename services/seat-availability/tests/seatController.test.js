const seatController = require('../src/controllers/seatController');
const SeatInventory = require('../src/models/SeatInventory');
const { publishEvent } = require('../src/config/kafka');
const mongoose = require('mongoose');

jest.mock('../src/models/SeatInventory');
jest.mock('../src/config/kafka', () => ({
  publishEvent: jest.fn()
}));

describe('seatController', () => {
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

  describe('getSeatAvailability', () => {
    it('should return 400 for invalid scheduleId', async () => {
      req.params.scheduleId = 'invalid';
      await seatController.getSeatAvailability(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if inventory not found', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.getSeatAvailability(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return inventory if found', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: '1' })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.getSeatAvailability(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: '1' } });
    });
  });

  describe('initializeInventory', () => {
    it('should return 409 if already initialized', async () => {
      req.body = { scheduleId: new mongoose.Types.ObjectId().toString(), trainId: new mongoose.Types.ObjectId().toString() };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue({ _id: '1' })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.initializeInventory(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should initialize and return inventory', async () => {
      req.body = { 
        scheduleId: new mongoose.Types.ObjectId().toString(), 
        trainId: new mongoose.Types.ObjectId().toString(),
        totalSeats: 100,
        classSummary: [{ className: 'FIRST', total: 20 }]
      };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue(null)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      SeatInventory.create.mockResolvedValue({ _id: '1' });
      await seatController.initializeInventory(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(SeatInventory.create).toHaveBeenCalled();
    });
  });

  describe('reserveSeat', () => {
    it('should return 400 for invalid seat class', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'INVALID' };
      await seatController.reserveSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if inventory not found', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue(null)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.reserveSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if not enough seats', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', seatCount: 2 };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue({ classSummary: [{ className: 'FIRST', available: 1 }] })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.reserveSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should reserve seat and publish event', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', seatCount: 1, bookingId: 'b1', passengerId: 'p1' };
      const inventory = { _id: 'i1', classSummary: [{ className: 'FIRST', available: 10, total: 10 }] };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue(inventory)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      SeatInventory.findOneAndUpdate.mockResolvedValue({ availableSeats: 9 });
      
      await seatController.reserveSeat(req, res, next);
      expect(publishEvent).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should handle race condition (409) if update fails', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', seatCount: 1 };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue({ _id: 'i1', classSummary: [{ className: 'FIRST', available: 10, total: 10 }] })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      SeatInventory.findOneAndUpdate.mockResolvedValue(null);
      await seatController.reserveSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('releaseSeat', () => {
    it('should return 400 for invalid seat class', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'INVALID' };
      await seatController.releaseSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should release seat and publish event', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', bookingId: 'b1' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue({ _id: 'i1' })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      SeatInventory.findOneAndUpdate.mockResolvedValue({ availableSeats: 10 });
      await seatController.releaseSeat(req, res, next);
      expect(publishEvent).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    
    it('should handle inventory not found', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', bookingId: 'b1' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue(null)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.releaseSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    it('should handle class not found in inventory during update', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      req.body = { seatClass: 'FIRST', bookingId: 'b1' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockResolvedValue({ _id: 'i1' })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      SeatInventory.findOneAndUpdate.mockResolvedValue(null);
      await seatController.releaseSeat(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSeatDetail', () => {
    it('should return seat detail', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: '1' })
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.getSeatDetail(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: '1' } });
    });
    
    it('should return 404 if not found', async () => {
      req.params.scheduleId = new mongoose.Types.ObjectId().toString();
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      };
      SeatInventory.findOne.mockReturnValue(mockQuery);
      await seatController.getSeatDetail(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
