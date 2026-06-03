import { Response } from 'express';

export function SetAccessTokenCookieOptions(
  res: Response,
  accessToken: string,
) {
  res.cookie('accessToken', accessToken, {
    sameSite: 'lax',
    path: '/',
    secure: true,
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
    sameSite: 'lax',
    path: '/',
    secure: true,
    httpOnly: true,
    maxAge: sevenDaysInMs - bufferTimeInMs,
  });
}

export function RemoveAccessTokenCookieOptions(res: Response) {
  res.clearCookie('accessToken', {
    sameSite: 'lax',
    path: '/',
    secure: true,
    httpOnly: true,
  });
}

export function RemoveRefreshTokenCookieOptions(res: Response) {
  res.clearCookie('refreshToken', {
    path: '/',
    sameSite: 'lax',
    secure: true,
    httpOnly: true,
  });
}
