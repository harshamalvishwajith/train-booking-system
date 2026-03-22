const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookingdb';
  try {
    await mongoose.connect(uri);
    console.log('[ticket-booking] MongoDB connected');
  } catch (err) {
    console.error('[ticket-booking] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
