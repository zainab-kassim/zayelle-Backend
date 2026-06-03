import { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export function SetAccessTokenCookieOptions(
  res: Response,
  accessToken: string,
) {
  res.cookie('accessToken', accessToken, {
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    secure: isProduction,
    httpOnly: true,
    maxAge: 20 * 60 * 1000,
  });
}

export function SetRefreshTokenCookieOptions(
  res: Response,
  refreshToken: string,
) {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const bufferTimeInMs = 60 * 60 * 1000;

  res.cookie('refreshToken', refreshToken, {
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    secure: isProduction,
    httpOnly: true,
    maxAge: sevenDaysInMs - bufferTimeInMs,
  });
}

export function RemoveAccessTokenCookieOptions(res: Response) {
  res.clearCookie('accessToken', {
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    secure: isProduction,
    httpOnly: true,
  });
}

export function RemoveRefreshTokenCookieOptions(res: Response) {
  res.clearCookie('refreshToken', {
    path: '/',
    sameSite: isProduction ? 'strict' : 'lax',
    secure: isProduction,
    httpOnly: true,
  });
}
