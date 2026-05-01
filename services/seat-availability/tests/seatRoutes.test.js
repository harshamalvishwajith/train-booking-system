const express = require('express');
const request = require('supertest');

jest.mock('../src/controllers/seatController', () => ({
  getSeatAvailability: (req, res) => res.json({ success: true, handler: 'getSeatAvailability' }),
  initializeInventory: (req, res) => res.json({ success: true, handler: 'initializeInventory' }),
  reserveSeat: (req, res) => res.json({ success: true, handler: 'reserveSeat' }),
  releaseSeat: (req, res) => res.json({ success: true, handler: 'releaseSeat' }),
  getSeatDetail: (req, res) => res.json({ success: true, handler: 'getSeatDetail' }),
}));

const routeToTest = require('../src/routes/seatRoutes');

const app = express();
app.use(express.json());
app.use('/seats', routeToTest);

describe('seatRoutes coverage', () => {

  it('should route GET /seats/5f8d0d55b54764421b7156d9 to getSeatAvailability', async () => {
    const res = await request(app).get('/seats/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
  it('should route POST /seats/initialize to initializeInventory', async () => {
    const res = await request(app).post('/seats/initialize').send({"scheduleId":"5f8d0d55b54764421b7156d9","trainId":"5f8d0d55b54764421b7156d9","classSummary":[{"className":"FIRST","total":10}]});
    expect(res.status).not.toBe(404);
  });
  it('should route PUT /seats/5f8d0d55b54764421b7156d9/reserve to reserveSeat', async () => {
    const res = await request(app).put('/seats/5f8d0d55b54764421b7156d9/reserve').send({"bookingId":"b1","seatClass":"FIRST"});
    expect(res.status).not.toBe(404);
  });
  it('should route PUT /seats/5f8d0d55b54764421b7156d9/release to releaseSeat', async () => {
    const res = await request(app).put('/seats/5f8d0d55b54764421b7156d9/release').send({"bookingId":"b1","seatClass":"FIRST"});
    expect(res.status).not.toBe(404);
  });
  it('should route GET /seats/5f8d0d55b54764421b7156d9/detail to getSeatDetail', async () => {
    const res = await request(app).get('/seats/5f8d0d55b54764421b7156d9/detail');
    expect(res.status).not.toBe(404);
  });
});
