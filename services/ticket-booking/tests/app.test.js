const request = require('supertest');
const express = require('express');

jest.mock('../src/config/db', () => jest.fn().mockResolvedValue(true));
jest.mock('../src/config/kafka', () => ({
  connectKafka: jest.fn().mockResolvedValue(true),
  publishEvent: jest.fn()
}));

jest.spyOn(express.application, 'listen').mockImplementation(function() {
  return { close: jest.fn() };
});
jest.spyOn(console, 'log').mockImplementation(() => {});

const app = require('../src/app');

describe('app.js', () => {
  it('should expose /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
