import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'customer' | 'admin';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  preferences: {
    newsletter: boolean;
    favoriteCategories: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    phone: { type: String, trim: true },
    preferences: {
      newsletter: { type: Boolean, default: true },
      favoriteCategories: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
