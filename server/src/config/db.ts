import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB instance using Mongoose.
 */
export async function connectDB(): Promise<typeof mongoose | void> {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartserve';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${mongoURI}: ${(error as Error).message}`);
    console.warn('[Database Warning] Running in offline/disconnected DB mode until MongoDB is reachable.');
  }
}

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection lost. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB runtime error:', err);
});

// Graceful disconnection on application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed due to app termination (SIGINT).');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed due to app termination (SIGTERM).');
  process.exit(0);
});
