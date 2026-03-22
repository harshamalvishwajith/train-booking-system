const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/seatdb';
  try {
    await mongoose.connect(uri);
    console.log('[seat-availability] MongoDB connected');
  } catch (err) {
    console.error('[seat-availability] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
