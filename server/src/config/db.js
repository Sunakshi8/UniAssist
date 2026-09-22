const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectWithMemoryDB() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri('uniassist');
  await mongoose.connect(uri);
  console.log('[db] MongoDB connected to in-memory server');
  return mongoServer;
}

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('[db] MONGO_URI is not set. Starting a local in-memory MongoDB instance for development.');
    await connectWithMemoryDB();
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.warn('[db] MongoDB connection failed:', err.message);
    console.warn('[db] Falling back to an in-memory MongoDB instance for local development.');
    await connectWithMemoryDB();
  }
}

module.exports = connectDB;
