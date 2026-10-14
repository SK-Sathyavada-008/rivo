import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB(): Promise<void> {
  const uri = ENV.MONGODB_URI;

  try {
    console.log('[DB] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[DB] Connected to MongoDB Atlas: ${mongoose.connection.name}`);
  } catch (error: any) {
    console.error('[DB] Connection error:', error.message);
    // If it's a DNS SRV error and SRV was used, log a helpful tip
    if (error.code === 'ECONNREFUSED' && uri.includes('mongodb+srv://')) {
      console.error('[DB] Hint: Use direct replica set URI format to bypass Windows DNS SRV lookup issues.');
    }
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB error event:', err);
});
