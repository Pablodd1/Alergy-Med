import mongoose, { Mongoose } from 'mongoose';
import { MockDatabase } from './mock-database';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not set, using mock database for development');
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose | null> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<Mongoose | null> {
  // If no MongoDB URI is provided, use mock database
  if (!MONGODB_URI) {
    console.log('Using mock database for development');
    await MockDatabase.connect();
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection failed:', error);
      console.log('Falling back to mock database');
      return MockDatabase.connect().then(() => null);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection failed, using mock database:', e);
    await MockDatabase.connect();
    return null;
  }

  return cached.conn;
}

export default connectToDatabase;