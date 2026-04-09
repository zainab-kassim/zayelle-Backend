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
      if (!req.ip) return res.status(429).send('Too many requests');
      await limiter.consume(req.ip);
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
