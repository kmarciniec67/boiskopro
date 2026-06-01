import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('demo:')) {
    return hash === `demo:${password}`;
  }
  return bcrypt.compare(password, hash);
}
