require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const { connectKafka } = require('./config/kafka');
const swaggerSpec = require('./config/swagger');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/bookings', bookingRoutes);

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'ticket-booking',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

app.use(errorHandler);

async function bootstrap() {
  await connectDB();
  await connectKafka();
  app.listen(PORT, () => {
    console.log(`[ticket-booking] Service running on port ${PORT}`);
    console.log(`[ticket-booking] API docs at http://localhost:${PORT}/api-docs`);
  });
}

bootstrap().catch((err) => {
  console.error('[ticket-booking] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
