const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'Consumes Kafka events (booking.created, booking.cancelled) and sends email notifications. Exposes notification history endpoint.',
    },
    servers: [
      { url: 'http://localhost:3004', description: 'Local development' },
      { url: 'https://notification.azurecontainerapps.io', description: 'Azure production' },
    ],
    tags: [{ name: 'Notifications', description: 'Notification history and status' }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
