import { Request, Response, NextFunction } from 'express';

export const currencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const manualCurrency = Array.isArray(req.headers['x-currency'])
    ? req.headers['x-currency'][0]
    : req.headers['x-currency'];

  if (manualCurrency) {
    req.currency = manualCurrency;
    return next();
  }

  try {
    const ip =
      process.env.NODE_ENV !== 'production'
        ? '24.48.0.1' // temp Canadian IP for testing
        : req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = await fetch(`https://free.freeipapi.com/api/json/${ip}`);
    const data = await geo.json();
    req.currency = data.currencies?.[0] || 'USD';
  } catch (_error) {
    req.currency = 'USD'; // fallback if API fails
  }

  next();
};
