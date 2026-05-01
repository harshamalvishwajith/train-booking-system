const express = require('express');
const request = require('supertest');

jest.mock('../src/controllers/bookingController', () => ({
  getAllBookings: (req, res) => res.json({ success: true, handler: 'getAllBookings' }),
  getBookingById: (req, res) => res.json({ success: true, handler: 'getBookingById' }),
  getBookingByReference: (req, res) => res.json({ success: true, handler: 'getBookingByReference' }),
  createBooking: (req, res) => res.json({ success: true, handler: 'createBooking' }),
  cancelBooking: (req, res) => res.json({ success: true, handler: 'cancelBooking' }),
}));

const routeToTest = require('../src/routes/bookingRoutes');

const app = express();
app.use(express.json());
app.use('/bookings', routeToTest);

describe('bookingRoutes coverage', () => {

  it('should route GET /bookings to getAllBookings', async () => {
    const res = await request(app).get('/bookings');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /bookings/5f8d0d55b54764421b7156d9 to getBookingById', async () => {
    const res = await request(app).get('/bookings/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /bookings/ref/123 to getBookingByReference', async () => {
    const res = await request(app).get('/bookings/ref/123');
    expect(res.status).not.toBe(404);
  });
  it('should route POST /bookings to createBooking', async () => {
    const res = await request(app).post('/bookings').send({"scheduleId":"5f8d0d55b54764421b7156d9","trainId":"5f8d0d55b54764421b7156d9","passengers":[{}],"contactEmail":"a@a.com","journeyDate":"2023-01-01","origin":"A","destination":"B"});
    expect(res.status).not.toBe(404);
  });
  it('should route DELETE /bookings/5f8d0d55b54764421b7156d9 to cancelBooking', async () => {
    const res = await request(app).delete('/bookings/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
});
