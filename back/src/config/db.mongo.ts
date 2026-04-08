import mongoose from 'mongoose';

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/bobconnect';

  await mongoose.connect(uri);
  console.log('[mongo] Connected to MongoDB');

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] Disconnected from MongoDB');
  });
}
