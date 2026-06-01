import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'boiskopro-dev-secret';

export interface TokenPayload {
  userId: string;
  role: 'customer' | 'admin';
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
