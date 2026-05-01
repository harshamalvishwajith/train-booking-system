const trainController = require('../src/controllers/trainController');
const Train = require('../src/models/Train');
const { publishEvent } = require('../src/config/kafka');
const mongoose = require('mongoose');

jest.mock('../src/models/Train');
jest.mock('../src/config/kafka', () => ({
  publishEvent: jest.fn()
}));

describe('trainController', () => {
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

  describe('getAllTrains', () => {
    it('should return trains with success queries', async () => {
      req.query = { type: 'EXPRESS', isActive: 'true', page: '1', limit: '10' };
      
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '1' }])
      };
      
      Train.find.mockReturnValue(mockQuery);
      Train.find().merge = jest.fn().mockReturnThis();
      Train.find().countDocuments = jest.fn().mockResolvedValue(1);

      await trainController.getAllTrains(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, page: 1, data: [{ _id: '1' }] });
    });

    it('should handle invalid type and skip where clause', async () => {
      req.query = { type: 'INVALID', isActive: 'false' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      Train.find.mockReturnValue(mockQuery);
      Train.find().merge = jest.fn().mockReturnThis();
      Train.find().countDocuments = jest.fn().mockResolvedValue(0);

      await trainController.getAllTrains(req, res, next);

      expect(mockQuery.where).toHaveBeenCalledWith('isActive');
      expect(mockQuery.where).not.toHaveBeenCalledWith('type');
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 0, page: 1, data: [] });
    });

    it('should call next on error', async () => {
      Train.find.mockImplementation(() => { throw new Error('DB Error'); });
      await trainController.getAllTrains(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getTrainById', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params.id = 'invalid-id';
      await trainController.getTrainById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].status).toBe(400);
    });

    it('should return 404 if train not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Train.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      await trainController.getTrainById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Train not found' });
    });

    it('should return train if found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      const mockTrain = { _id: req.params.id };
      Train.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockTrain)
      });
      await trainController.getTrainById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTrain });
    });
  });

  describe('createTrain', () => {
    it('should create and return train and publish event', async () => {
      req.body = { trainNumber: '123', name: 'Express' };
      const mockTrain = { _id: '1', trainNumber: '123' };
      Train.create.mockResolvedValue(mockTrain);
      await trainController.createTrain(req, res, next);
      expect(publishEvent).toHaveBeenCalledWith('train.created', { trainId: '1', trainNumber: '123' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTrain });
    });

    it('should call next on error', async () => {
      Train.create.mockRejectedValue(new Error('DB Error'));
      await trainController.createTrain(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateTrain', () => {
    it('should update and return train and publish event', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { name: 'Updated Express', invalidField: 'test' };
      const mockTrain = { _id: req.params.id, name: 'Updated Express' };
      Train.findByIdAndUpdate.mockResolvedValue(mockTrain);
      await trainController.updateTrain(req, res, next);
      expect(publishEvent).toHaveBeenCalledWith('train.updated', { trainId: req.params.id });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTrain });
      expect(Train.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        { name: 'Updated Express' }, // Only allowed updates
        { new: true, runValidators: true }
      );
    });

    it('should return 404 if not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { name: 'Updated' };
      Train.findByIdAndUpdate.mockResolvedValue(null);
      await trainController.updateTrain(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid train id', async () => {
      req.params.id = 'invalid';
      await trainController.updateTrain(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteTrain', () => {
    it('should soft delete train and return success', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Train.findByIdAndUpdate.mockResolvedValue({ _id: req.params.id });
      await trainController.deleteTrain(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Train deactivated' });
    });

    it('should return 404 if not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Train.findByIdAndUpdate.mockResolvedValue(null);
      await trainController.deleteTrain(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for invalid train id', async () => {
      req.params.id = 'invalid';
      await trainController.deleteTrain(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
