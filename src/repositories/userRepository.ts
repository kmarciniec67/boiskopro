import { User, IUser, type UserRole } from '../models/mongo/User.js';
import { Review, IReview } from '../models/mongo/Review.js';
import { ActivityLog } from '../models/mongo/ActivityLog.js';
import { Types } from 'mongoose';

export async function findAllUsers(): Promise<IUser[]> {
  return User.find().select('-passwordHash').sort({ createdAt: -1 });
}

export async function findUserById(id: string): Promise<IUser | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findById(id).select('-passwordHash');
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase() }).select('-passwordHash');
}

export async function deleteUserById(id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const result = await User.findByIdAndDelete(id);
  return result !== null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}): Promise<IUser> {
  const user = await User.create(data);
  return user;
}

export async function findReviewsByProductId(productId: number): Promise<IReview[]> {
  return Review.find({ productId }).populate('userId', 'firstName lastName').sort({ createdAt: -1 });
}

export async function deleteReviewsByProductId(productId: number): Promise<void> {
  await Review.deleteMany({ productId });
}

export async function createReview(data: {
  productId: number;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase?: boolean;
}): Promise<IReview> {
  return Review.create({
    ...data,
    userId: new Types.ObjectId(data.userId),
  });
}

export async function logActivity(data: {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await ActivityLog.create({
    ...data,
    userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
  });
}

export async function getRecentActivity(limit = 20) {
  return ActivityLog.find()
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
}
