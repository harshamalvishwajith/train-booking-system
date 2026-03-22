require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const { connectKafka } = require('./config/kafka');
const swaggerSpec = require('./config/swagger');
const trainRoutes = require('./routes/trainRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// ─── General Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── API Docs ──────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/trains', trainRoutes);
app.use('/api/schedules', scheduleRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'train-management',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();
  await connectKafka();
  app.listen(PORT, () => {
    console.log(`[train-management] Service running on port ${PORT}`);
    console.log(`[train-management] API docs at http://localhost:${PORT}/api-docs`);
  });
}

bootstrap().catch((err) => {
  console.error('[train-management] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
