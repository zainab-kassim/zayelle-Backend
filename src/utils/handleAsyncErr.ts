import { NextFunction, Request, RequestHandler, Response } from 'express';
import logger from '../middleware/logger';

export function handleAsyncErr(fn: RequestHandler) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await fn(req, res, next);
    } catch (err) {
      logger.error({ err }, 'Error in async handler:');
      next(err);
    }
  };
}
