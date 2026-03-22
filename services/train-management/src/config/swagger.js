const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Train Management Service API',
      version: '1.0.0',
      description: 'Manages trains, routes and schedules for the Train Booking System',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'https://train-management.azurecontainerapps.io', description: 'Azure production' },
    ],
    tags: [
      { name: 'Trains', description: 'Train CRUD operations' },
      { name: 'Schedules', description: 'Schedule management' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
