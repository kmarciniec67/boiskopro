import mongoose from 'mongoose';
import { config } from '../config/index.js';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(config.mongodb.uri);
  console.log('MongoDB connected');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
