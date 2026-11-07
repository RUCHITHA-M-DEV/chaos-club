import mongoose from 'mongoose';

export async function connectDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('ℹ️ MONGODB_URI not provided. Running with high-performance In-Memory state manager.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('⚠️ MongoDB Connection Error:', error);
    console.log('ℹ️ Falling back to In-Memory state manager.');
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
