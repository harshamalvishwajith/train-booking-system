const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/traindb';
  try {
    await mongoose.connect(uri);
    console.log('[train-management] MongoDB connected');
  } catch (err) {
    console.error('[train-management] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
