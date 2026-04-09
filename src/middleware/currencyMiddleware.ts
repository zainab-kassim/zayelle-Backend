import { Request, Response, NextFunction } from 'express';

const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'CAD', 'NGN'];

const DEFAULT_CURRENCY = 'USD';

export const currencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const manualCurrency = Array.isArray(req.headers['x-currency'])
    ? req.headers['x-currency'][0]
    : req.headers['x-currency'];

  if (manualCurrency) {
    const normalizedCurrency = manualCurrency.trim().toUpperCase();
    req.currency = SUPPORTED_CURRENCIES.includes(normalizedCurrency)
      ? normalizedCurrency
      : DEFAULT_CURRENCY;
    return next();
  }

  try {
    const ip = req.ip;
    const geo = await fetch(`https://free.freeipapi.com/api/json/${ip}`);
    const data = await geo.json();

    const currencyfromIp = data.currencies?.[0]?.toUpperCase();
    req.currency = SUPPORTED_CURRENCIES.includes(currencyfromIp)
      ? currencyfromIp
      : DEFAULT_CURRENCY;
  } catch (_error) {
    req.currency = 'USD'; // fallback if API fails
  }

  next();
};
