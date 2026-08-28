import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { GenerateAccessToken, GenerateRefreshToken } from '../auth/auth';
import {
  SetAccessTokenCookieOptions,
  SetRefreshTokenCookieOptions,
  RemoveRefreshTokenCookieOptions,
  RemoveAccessTokenCookieOptions,
} from '../utils/authCookies';
import { supabase } from '../config/db';
import { RefreshSecretKey, GoogleClientId } from '../auth/config';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseAdmin';
import crypto from 'crypto';
import logger from '../middleware/logger';
import { issueSession } from '../utils/issueSession';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(GoogleClientId);

export const UserSignup = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;

  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(409).json({
      message: 'Account already exists. Please log in instead.',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: newUser, error: newUserError } = await supabase
    .from('users')
    .insert({
      fullName,
      email,
      password: hashedPassword,
    })
    .select()
    .single();

  if (newUserError) {
    logger.error({ newUserError }, 'Error creating user');
    return res.status(500).json({ message: 'Error creating user' });
  }

  await issueSession(res, { id: newUser.id, email: newUser.email });

  res.status(201).json({
    message: 'user signed up successfully',
    user: { fullName: newUser.fullName, email: newUser.email },
  });
};

export const UserLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (!user || userError) {
    logger.error({ userError }, 'Invalid email or password');
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Google-only accounts have no password to compare against
  if (!user.password) {
    return res.status(401).json({
      message: 'This account uses Google sign-in. Continue with Google.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.error({ userError }, 'Invalid email or password');
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  await issueSession(res, { id: user.id, email: user.email });

  res.status(200).json({
    message: 'user logged in successfully',
    user: { fullName: user.fullName, email: user.email },
  });
};

export const GoogleAuth = async (req: Request, res: Response) => {
  const { accessToken } = req.body;

  if (!GoogleClientId) {
    logger.error('GOOGLE_CLIENT_ID is not configured');
    return res
      .status(500)
      .json({ message: 'Google sign-in is not configured' });
  }

  // getTokenInfo asks Google about the access token and returns its claims —
  // it throws if the token is invalid or expired
  let tokenInfo;
  try {
    tokenInfo = await googleClient.getTokenInfo(accessToken);
  } catch (err) {
    logger.error({ err }, 'Invalid Google access token');
    return res.status(401).json({ message: 'Invalid Google sign-in' });
  }

  // `aud` must be our client id — proves the token was minted for this app
  if (tokenInfo.aud !== GoogleClientId) {
    return res.status(401).json({ message: 'Invalid Google sign-in' });
  }

  if (!tokenInfo.email || !tokenInfo.email_verified) {
    return res
      .status(401)
      .json({ message: 'Your Google email is not verified' });
  }

  const email = tokenInfo.email;

  // the token info has no display name — fetch it from the userinfo endpoint,
  // falling back to the email if that call fails
  let fullName = email;
  try {
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { name?: string };
      if (profile.name) fullName = profile.name;
    }
  } catch (err) {
    logger.error(
      { err },
      'Could not fetch Google userinfo; using email as name',
    );
  }

  // find-or-create: existing row → this is a login; no row → this is a signup
  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  let user = existingUser;

  if (!user) {
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert({ fullName, email })
      .select()
      .single();

    if (newUserError || !newUser) {
      logger.error({ newUserError }, 'Error creating Google user');
      return res.status(500).json({ message: 'Error creating user' });
    }
    user = newUser;
  }

  await issueSession(res, { id: user.id, email: user.email });

  res.status(200).json({
    message: 'user signed in with Google successfully',
    user: { fullName: user.fullName, email: user.email },
  });
};

export const UserLogout = async (req: Request, res: Response) => {
  if (req.user && req.cookies.refreshToken) {
    // only tear down this device's session — other devices stay logged in
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(req.cookies.refreshToken)
      .digest('hex');

    const { data: _session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('user_id', req.user.id)
      .eq('refresh_token', hashedRefreshToken);

    if (sessionError) {
      logger.error({ sessionError }, 'Error logging out user');
      return res.status(500).json({ message: 'Something went wrong' });
    }
  }
  RemoveAccessTokenCookieOptions(res);
  RemoveRefreshTokenCookieOptions(res);

  return res.status(200).json({ message: 'User logged out successfully' });
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'No refresh token provided',
      code: 'REFRESH_TOKEN_NOT_FOUND',
    });
  }

  if (!RefreshSecretKey) {
    return res.status(500).json({
      message: 'Refresh token secret key not found',
      code: 'REFRESH_TOKEN_SECRET_KEY_NOT_CONFIGURED',
    });
  }

  jwt.verify(
    refreshToken,
    RefreshSecretKey,
    async (err: VerifyErrors | null, user: JwtPayload | string | undefined) => {
      if (err)
        return res
          .status(403)
          .json({ message: 'Session timed out. Please log in again.' });
      const payload = user as JwtPayload;

      const hashedIncomingToken = crypto
        .createHash('sha256')
        .update(req.cookies.refreshToken)
        .digest('hex');

      const { data: existingsession, error: existingsessionError } =
        await supabaseAdmin
          .from('sessions')
          .select()
          .eq('user_id', payload.id)
          .eq('refresh_token', hashedIncomingToken)
          .single();

      if (existingsessionError || !existingsession) {
        const { data: _session } = await supabaseAdmin
          .from('sessions')
          .delete()
          .eq('user_id', payload.id);

        // token not in DB - could be stolen/reused
        return res.status(403).json({
          message: 'Invalid, Please log in again',
        });
      }

      const accessToken = GenerateAccessToken({
        email: payload.email,
        id: payload.id,
      });

      const newrefreshToken = GenerateRefreshToken({
        email: payload.email,
        id: payload.id,
      });

      const hashedRefreshToken = crypto
        .createHash('sha256')
        .update(newrefreshToken)
        .digest('hex');

      // scoped to this specific session row so rotating it doesn't
      // invalidate the user's other devices/tabs
      const { data: _session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .update({ refresh_token: hashedRefreshToken })
        .eq('id', existingsession.id);

      if (sessionError) {
        return res.status(500).json({ message: 'Something went wrong' });
      }

      // Set the new refresh token in the cookies
      SetRefreshTokenCookieOptions(res, newrefreshToken);

      // Set the new access token in the cookies
      SetAccessTokenCookieOptions(res, accessToken);

      return res
        .status(200)
        .json({ message: 'Access token refreshed successfully' });
    },
  );
};
