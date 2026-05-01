const bookingController = require('../src/controllers/bookingController');
const Booking = require('../src/models/Booking');
const { publishEvent } = require('../src/config/kafka');
const axios = require('axios');
const mongoose = require('mongoose');

jest.mock('../src/models/Booking');
jest.mock('../src/config/kafka', () => ({
  publishEvent: jest.fn()
}));
jest.mock('axios');

describe('bookingController', () => {
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

  describe('getAllBookings', () => {
    it('should return bookings with valid queries', async () => {
      req.query = { email: 'TEST@EXAMPLE.COM', status: 'CONFIRMED', page: '1', limit: '10' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: '1' }])
      };
      Booking.find.mockReturnValue(mockQuery);
      Booking.find().merge = jest.fn().mockReturnThis();
      Booking.find().countDocuments = jest.fn().mockResolvedValue(1);

      await bookingController.getAllBookings(req, res, next);
      
      // Email should be converted to lower case
      expect(mockQuery.equals).toHaveBeenCalledWith('test@example.com');
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 1, page: 1, data: [{ _id: '1' }] });
    });

    it('should ignore invalid status queries', async () => {
      req.query = { status: 'INVALID' };
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };
      Booking.find.mockReturnValue(mockQuery);
      Booking.find().merge = jest.fn().mockReturnThis();
      Booking.find().countDocuments = jest.fn().mockResolvedValue(0);

      await bookingController.getAllBookings(req, res, next);
      
      expect(mockQuery.where).not.toHaveBeenCalledWith('status');
      expect(res.json).toHaveBeenCalledWith({ success: true, total: 0, page: 1, data: [] });
    });
  });

  describe('getBookingById', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params.id = 'invalid';
      await bookingController.getBookingById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return 404 if booking not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Booking.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });
      await bookingController.getBookingById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return booking if found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Booking.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: req.params.id })
      });
      await bookingController.getBookingById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getBookingByReference', () => {
    it('should return 400 for invalid reference', async () => {
      req.params.reference = null;
      await bookingController.getBookingByReference(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if not found', async () => {
      req.params.reference = 'REF123';
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      };
      Booking.findOne.mockReturnValue(mockQuery);
      await bookingController.getBookingByReference(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return booking', async () => {
      req.params.reference = 'ref123';
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ _id: '1' })
      };
      Booking.findOne.mockReturnValue(mockQuery);
      await bookingController.getBookingByReference(req, res, next);
      // reference converted to uppercase
      expect(mockQuery.equals).toHaveBeenCalledWith('REF123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('createBooking', () => {
    beforeEach(() => {
      req.body = {
        scheduleId: new mongoose.Types.ObjectId().toString(),
        trainId: new mongoose.Types.ObjectId().toString(),
        seatClass: 'FIRST',
        passengers: [{ name: 'John Doe', email: 'j@example.com' }],
        contactEmail: 'contact@example.com',
        journeyDate: '2023-12-01',
        origin: 'A',
        destination: 'B'
      };
    });

    it('should return 400 if schedule cancelled', async () => {
      axios.get.mockResolvedValue({ data: { data: { status: 'CANCELLED' } } });
      await bookingController.createBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 502 if schedule check fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));
      await bookingController.createBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('should handle seat reservation failure', async () => {
      axios.get.mockResolvedValue({ data: { data: { status: 'SCHEDULED', distanceKm: 100 } } });
      axios.put.mockRejectedValue({ response: { status: 409, data: { message: 'No seats' } } });
      await bookingController.createBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'No seats' }));
    });

    it('should create booking successfully', async () => {
      axios.get.mockResolvedValue({ data: { data: { status: 'SCHEDULED', distanceKm: 100, trainId: { classes: [{ className: 'FIRST', pricePerKm: 2 }] } } } });
      axios.put.mockResolvedValueOnce({ data: { data: { reservedSeats: [{ seatNumber: 'F001' }] } } });
      axios.put.mockResolvedValueOnce({}); // second put for updating bookingId
      
      const mockBooking = { _id: '1', ...req.body, bookingReference: 'REF', passengers: [{ seatNumber: 'F001' }] };
      Booking.create.mockResolvedValue(mockBooking);

      await bookingController.createBooking(req, res, next);
      expect(Booking.create).toHaveBeenCalled();
      expect(publishEvent).toHaveBeenCalledWith('booking.created', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    it('should still succeed even if second put (update temp ref) fails', async () => {
      axios.get.mockResolvedValue({ data: { data: { status: 'SCHEDULED', distanceKm: 100 } } });
      axios.put.mockResolvedValueOnce({ data: { data: { reservedSeats: [{ seatNumber: 'F001' }] } } });
      axios.put.mockRejectedValueOnce(new Error('Ignore this error')); 
      
      Booking.create.mockResolvedValue({ _id: '1', passengers: [] });
      await bookingController.createBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('cancelBooking', () => {
    it('should return 404 if booking not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Booking.findById.mockResolvedValue(null);
      await bookingController.cancelBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if already cancelled', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      Booking.findById.mockResolvedValue({ status: 'CANCELLED' });
      await bookingController.cancelBooking(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should cancel booking and publish event', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      const mockBooking = { 
        _id: req.params.id, 
        status: 'CONFIRMED', 
        scheduleId: new mongoose.Types.ObjectId().toString(),
        passengers: [{ seatNumber: '1' }],
        save: jest.fn().mockResolvedValue(true)
      };
      Booking.findById.mockResolvedValue(mockBooking);
      axios.put.mockResolvedValue({}); // release seats mock

      await bookingController.cancelBooking(req, res, next);
      
      expect(mockBooking.status).toBe('CANCELLED');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(publishEvent).toHaveBeenCalledWith('booking.cancelled', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    
    it('should gracefully handle seat release failure', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      const mockBooking = { 
        _id: req.params.id, 
        status: 'CONFIRMED', 
        scheduleId: new mongoose.Types.ObjectId().toString(),
        passengers: [{ seatNumber: '1' }],
        save: jest.fn().mockResolvedValue(true)
      };
      Booking.findById.mockResolvedValue(mockBooking);
      axios.put.mockRejectedValue(new Error('Ignore this error'));

      await bookingController.cancelBooking(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
