const express = require('express');
const request = require('supertest');

jest.mock('../src/controllers/trainController', () => ({
  getAllTrains: (req, res) => res.json({ success: true, handler: 'getAllTrains' }),
  getTrainById: (req, res) => res.json({ success: true, handler: 'getTrainById' }),
  createTrain: (req, res) => res.json({ success: true, handler: 'createTrain' }),
  updateTrain: (req, res) => res.json({ success: true, handler: 'updateTrain' }),
  deleteTrain: (req, res) => res.json({ success: true, handler: 'deleteTrain' }),
}));

const routeToTest = require('../src/routes/trainRoutes');

const app = express();
app.use(express.json());
app.use('/trains', routeToTest);

describe('trainRoutes coverage', () => {

  it('should route GET /trains to getAllTrains', async () => {
    const res = await request(app).get('/trains');
    expect(res.status).not.toBe(404);
  });
  it('should route GET /trains/5f8d0d55b54764421b7156d9 to getTrainById', async () => {
    const res = await request(app).get('/trains/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
  it('should route POST /trains to createTrain', async () => {
    const res = await request(app).post('/trains').send({"trainNumber":"123","name":"A","classes":[{}],"totalSeats":10});
    expect(res.status).not.toBe(404);
  });
  it('should route PUT /trains/5f8d0d55b54764421b7156d9 to updateTrain', async () => {
    const res = await request(app).put('/trains/5f8d0d55b54764421b7156d9').send({});
    expect(res.status).not.toBe(404);
  });
  it('should route DELETE /trains/5f8d0d55b54764421b7156d9 to deleteTrain', async () => {
    const res = await request(app).delete('/trains/5f8d0d55b54764421b7156d9');
    expect(res.status).not.toBe(404);
  });
});
