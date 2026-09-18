import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SecretKey, RefreshSecretKey } from './config';

export function GenerateAccessToken(user: { email: string; id: number }) {
  if (!SecretKey) throw new Error('Missing SECRET_KEY environment variable');
  // jti so a same-second refresh doesn't mint an identical token
  return Jwt.sign(
    { email: user.email, id: user.id, jti: crypto.randomUUID() },
    SecretKey,
    { expiresIn: '20m' },
  );
}

export function GenerateRefreshToken(user: { email: string; id: number }) {
  if (!RefreshSecretKey)
    throw new Error('Missing Refresh SECRET_KEY environment variable');
  // jti so a same-second refresh doesn't mint an identical token
  return Jwt.sign(
    { email: user.email, id: user.id, jti: crypto.randomUUID() },
    RefreshSecretKey,
    { expiresIn: '7d' },
  );
}
