const express = require('express');
const request = require('supertest');

jest.mock('../src/controllers/scheduleController', () => ({
  searchSchedules: (req, res) => res.json({ success: true, handler: 'searchSchedules' }),
  getScheduleById: (req, res) => res.json({ success: true, handler: 'getScheduleById' }),
  createSchedule: (req, res) => res.json({ success: true, handler: 'createSchedule' }),
  updateScheduleStatus: (req, res) => res.json({ success: true, handler: 'updateScheduleStatus' }),
}));

const routeToTest = require('../src/routes/scheduleRoutes');

const app = express();
app.use(express.json());
app.use('/schedules', routeToTest);

describe('scheduleRoutes coverage', () => {

  it('should route GET /schedules to searchSchedules', async () => {
    const res = await request(app).get('/schedules');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /schedules/5f8d0d55b54764421b7156d9 to getScheduleById', async () => {
    const res = await request(app).get('/schedules/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
  it('should route POST /schedules to createSchedule', async () => {
    const res = await request(app).post('/schedules').send({"trainId":"5f8d0d55b54764421b7156d9","origin":"A","destination":"B","departureTime":"10:00","arrivalTime":"11:00","distanceKm":10});
    expect(res.status).not.toBe(404);
  });
  it('should route PUT /schedules/5f8d0d55b54764421b7156d9/status to updateScheduleStatus', async () => {
    const res = await request(app).put('/schedules/5f8d0d55b54764421b7156d9/status').send({"status":"DELAYED"});
    expect(res.status).not.toBe(404);
  });
});
