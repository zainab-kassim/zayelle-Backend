import { Response } from 'express';
import crypto from 'crypto';
import { GenerateAccessToken, GenerateRefreshToken } from '../auth/auth';
import {
  SetAccessTokenCookieOptions,
  SetRefreshTokenCookieOptions,
} from './authCookies';
import { supabaseAdmin } from '../config/supabaseAdmin';

// Mints access + refresh tokens, stores the hashed refresh token as a new
// `sessions` row, and sets both auth cookies. Shared by every login path
// (signup, password login, Google) so session behavior stays consistent.
// Throws on DB failure — the global error handler returns 500 for it.
export const issueSession = async (
  res: Response,
  user: { id: number; email: string },
) => {
  const accessToken = GenerateAccessToken({ email: user.email, id: user.id });
  const refreshToken = GenerateRefreshToken({ email: user.email, id: user.id });

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // one row per device/session — insert, never overwrite, so signing in on a
  // second device doesn't invalidate the first
  const { error: sessionError } = await supabaseAdmin.from('sessions').insert({
    user_id: user.id,
    refresh_token: hashedRefreshToken,
  });

  if (sessionError) {
    throw new Error('Could not create session');
  }

  SetAccessTokenCookieOptions(res, accessToken);
  SetRefreshTokenCookieOptions(res, refreshToken);
};
