import { Request, Response, NextFunction } from 'express';
import logger from './logger';

const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'CAD', 'NGN'];

const DEFAULT_CURRENCY = 'USD';

// cache per IP
const ipCache = new Map<string, { currency: string; fetchedAt: Date }>();

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
    const ip = req.ip as string;
    logger.info({ ip }, 'Detecting currency for IP');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cached = ipCache.get(ip);

    // return cached result if fresh
    if (cached && cached.fetchedAt > oneHourAgo) {
      req.currency = cached.currency;
      return next();
    }

    const geo = await fetch(`https://free.freeipapi.com/api/json`);
    const data = await geo.json();

    logger.info({ geo }, 'Geolocation API response');

    const currencyfromIp = data.currencies?.[0]?.toUpperCase();
    logger.info({ ip, currencyfromIp }, 'Currency detected from IP');

    const detectedCurrency = SUPPORTED_CURRENCIES.includes(currencyfromIp)
      ? currencyfromIp
      : DEFAULT_CURRENCY;

    // store in cache
    ipCache.set(ip, { currency: detectedCurrency, fetchedAt: new Date() });
    req.currency = detectedCurrency;
  } catch (_error) {
    req.currency = 'USD'; // fallback if API fails
  }

  next();
};
