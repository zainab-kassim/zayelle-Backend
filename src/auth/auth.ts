import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SecretKey, RefreshSecretKey } from './config';

export function GenerateAccessToken(user: { email: string; id: number }) {
  if (!SecretKey) throw new Error('Missing SECRET_KEY environment variable');
  // jti makes every mint unique even if issued within the same second as the
  // last one — without it, signing is deterministic, so a same-second
  // refresh would silently produce the exact same token string again.
  return Jwt.sign(
    { email: user.email, id: user.id, jti: crypto.randomUUID() },
    SecretKey,
    { expiresIn: '20m' },
  );
}

export function GenerateRefreshToken(user: { email: string; id: number }) {
  if (!RefreshSecretKey)
    throw new Error('Missing Refresh SECRET_KEY environment variable');
  // jti makes every mint unique even if issued within the same second as the
  // last one — without it, signing is deterministic, so a same-second
  // refresh would silently produce the exact same token string again.
  return Jwt.sign(
    { email: user.email, id: user.id, jti: crypto.randomUUID() },
    RefreshSecretKey,
    { expiresIn: '7d' },
  );
}
