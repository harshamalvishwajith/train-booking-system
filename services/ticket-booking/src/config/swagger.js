const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Booking Service API',
      version: '1.0.0',
      description: 'Handles ticket reservations and passenger bookings. Orchestrates seat reservation via Seat Availability Service.',
    },
    servers: [
      { url: 'http://localhost:3003', description: 'Local development' },
      { url: 'https://ticket-booking.azurecontainerapps.io', description: 'Azure production' },
    ],
    tags: [{ name: 'Bookings', description: 'Ticket booking operations' }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
