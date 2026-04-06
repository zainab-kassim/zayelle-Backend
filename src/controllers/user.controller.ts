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
import { RefreshSecretKey } from '../auth/config';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabaseAdmin';
import crypto from 'crypto';

export const UserSignup = async (req: Request, res: Response) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(200).json({
      message: 'Account already exists. Please log in instead.',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      firstname: firstName,
      lastname: lastName,
      email,
      phonenumber: phoneNumber,
      password: hashedPassword,
    })
    .select()
    .single();

  if (error || !newUser) {
    return res.status(500).json({ message: 'Error creating user' });
  }

  const accessToken = GenerateAccessToken({
    email: newUser.email,
    id: newUser.id,
  });
  const refreshToken = GenerateRefreshToken({
    email: newUser.email,
    id: newUser.id,
  });

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const { data: _session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: newUser.id,
      refresh_token: hashedRefreshToken,
    });

  if (sessionError) {
    console.error('Session delete error:', sessionError);
    return res.status(500).json({ message: 'Something went wrong' });
  }

  SetAccessTokenCookieOptions(res, accessToken);
  SetRefreshTokenCookieOptions(res, refreshToken);
  res.status(201).json({
    message: 'user signed up successfully',
    user: { firstname: newUser.firstname },
  });
};

export const UserLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (!user || error) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const accessToken = GenerateAccessToken({ email: user.email, id: user.id });
  const refreshToken = GenerateRefreshToken({ email: user.email, id: user.id });

  SetAccessTokenCookieOptions(res, accessToken);
  SetRefreshTokenCookieOptions(res, refreshToken);

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const { data: existingSession, error: existingSessionError } =
    await supabaseAdmin
      .from('sessions')
      .select()
      .eq('user_id', user.id)
      .single();

  if (existingSessionError && existingSessionError.code !== 'PGRST116') {
    console.error('Error checking existing session:', existingSessionError);
    return res.status(500).json({ message: 'Something went wrong' });
  }

  if (existingSession) {
    const { data: _session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .update({
        refresh_token: hashedRefreshToken,
      })
      .eq('user_id', user.id);

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      return res.status(500).json({ message: 'Something went wrong' });
    }

    return res.status(200).json({
      message: 'user logged in successfully',
      user: { firstname: user.firstname },
    });
  }

  const { data: _session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: user.id,
      refresh_token: hashedRefreshToken,
    });

  if (sessionError) {
    console.error('Session insert error:', sessionError);
    return res.status(500).json({ message: 'Something went wrong' });
  }

  res.status(200).json({
    message: 'user logged in successfully',
    user: { firstname: user.firstname },
  });
};

export const UserLogout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { data: _session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('user_id', req.user.id);

  if (sessionError) {
    console.error('Session delete error:', sessionError);
    return res.status(500).json({ message: 'Something went wrong' });
  }
  RemoveAccessTokenCookieOptions(res);
  RemoveRefreshTokenCookieOptions(res);

  return res.status(200).json({ message: 'user logged out successfully' });
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

      const { data: _session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .update({ refresh_token: hashedRefreshToken })
        .eq('user_id', payload.id);

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
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
