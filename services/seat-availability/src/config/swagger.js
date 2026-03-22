const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Seat Availability Service API',
      version: '1.0.0',
      description: 'Manages seat inventory and availability for train schedules',
    },
    servers: [
      { url: 'http://localhost:3002', description: 'Local development' },
      { url: 'https://seat-availability.azurecontainerapps.io', description: 'Azure production' },
    ],
    tags: [{ name: 'Seats', description: 'Seat availability and reservation' }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
