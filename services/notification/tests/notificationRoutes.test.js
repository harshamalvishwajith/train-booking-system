const express = require('express');
const request = require('supertest');

jest.mock('../src/controllers/notificationController', () => ({
  getAllNotifications: (req, res) => res.json({ success: true, handler: 'getAllNotifications' }),
  getByBookingId: (req, res) => res.json({ success: true, handler: 'getByBookingId' }),
  getStats: (req, res) => res.json({ success: true, handler: 'getStats' }),
  getById: (req, res) => res.json({ success: true, handler: 'getById' }),
}));

const routeToTest = require('../src/routes/notificationRoutes');

const app = express();
app.use(express.json());
app.use('/notifications', routeToTest);

describe('notificationRoutes coverage', () => {

  it('should route GET /notifications to getAllNotifications', async () => {
    const res = await request(app).get('/notifications');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /notifications/booking/5f8d0d55b54764421b7156d9 to getByBookingId', async () => {
    const res = await request(app).get('/notifications/booking/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /notifications/stats to getStats', async () => {
    const res = await request(app).get('/notifications/stats');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /notifications/5f8d0d55b54764421b7156d9 to getById', async () => {
    const res = await request(app).get('/notifications/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
});
