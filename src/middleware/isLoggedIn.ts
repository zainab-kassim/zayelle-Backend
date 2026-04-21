import { Request, Response, NextFunction } from 'express';
import passport from '../auth/passport';
import logger from './logger';

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false | null) => {
      if (err || !user) {
        logger.error({ err }, 'unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};
