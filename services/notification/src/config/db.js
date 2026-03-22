const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notificationdb';
  try {
    await mongoose.connect(uri);
    console.log('[notification] MongoDB connected');
  } catch (err) {
    console.error('[notification] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
