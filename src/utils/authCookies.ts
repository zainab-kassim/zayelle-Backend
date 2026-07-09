import { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'Production';

export function SetAccessTokenCookieOptions(
  res: Response,
  accessToken: string,
) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction,
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
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction,
    maxAge: sevenDaysInMs - bufferTimeInMs,
  });
}

export function RemoveAccessTokenCookieOptions(res: Response) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
}

export function RemoveRefreshTokenCookieOptions(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
}
