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

export const UserSignup = async (req: Request, res: Response) => {
  const { firstName, lastName, email, phoneNumber, password } = req.body;

  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
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
    return res.status(500).json({ message: 'Error creating user', error });
  }

  const accessToken = GenerateAccessToken({
    email: newUser.email,
    id: newUser.id,
  });
  const refreshToken = GenerateRefreshToken({
    email: newUser.email,
    id: newUser.id,
  });

  SetAccessTokenCookieOptions(res, accessToken);
  SetRefreshTokenCookieOptions(res, refreshToken);
  res
    .status(200)
    .json({
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

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (error || !user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = GenerateAccessToken({ email: user.email, id: user.id });
  const refreshToken = GenerateRefreshToken({ email: user.email, id: user.id });

  SetAccessTokenCookieOptions(res, accessToken);
  SetRefreshTokenCookieOptions(res, refreshToken);

  res
    .status(200)
    .json({
      message: 'user logged in successfully',
      user: { firstname: user.firstname },
    });
};

export const UserLogout = async (req: Request, res: Response) => {
  RemoveAccessTokenCookieOptions(res);
  RemoveRefreshTokenCookieOptions(res);
  res.status(200).json({ message: 'user logged out successfully' });
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
    (err: VerifyErrors | null, user: JwtPayload | string | undefined) => {
      if (err)
        return res
          .status(403)
          .json({ message: 'Session timed out. Please log in again.' });
      const payload = user as JwtPayload;
      const accessToken = GenerateAccessToken({
        email: payload.email,
        id: payload.id,
      });

      // Set the new access token in the cookies
      SetAccessTokenCookieOptions(res, accessToken);

      return res
        .status(200)
        .json({ message: 'Access token refreshed successfully' });
    },
  );
};
