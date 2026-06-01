import type { IUser } from '../models/mongo/User.js';

export function toPublicUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    preferences: user.preferences,
  };
}
