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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = await fetch(`https://ipapi.co/${ip}/json/`);
    const { currency } = await geo.json();
    req.currency = currency || 'USD'; // fallback
  } catch (_error) {
    req.currency = 'USD'; // fallback if API fails
  }

  next();
};
