import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
  limiter,
  authlimiter,
  cartlimiter,
  paymentlimiter,
} from './rateLimiter';
import { Request, Response, NextFunction } from 'express';

const createMiddleware = (limiter: RateLimiterMemory) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.ip ||
        req.socket.remoteAddress;

      if (!ip) return res.status(400).send('Invalid');

      await limiter.consume(ip);
      next();
    } catch {
      res.status(429).send('Too many requests');
    }
  };
};

export const generalLimiter = createMiddleware(limiter);
export const authLimiter = createMiddleware(authlimiter);
export const cartLimiter = createMiddleware(cartlimiter);
export const paymentLimiter = createMiddleware(paymentlimiter);
