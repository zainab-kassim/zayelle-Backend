import { Request, Response, NextFunction } from 'express';
import type { ZodObject, ZodRawShape } from 'zod';

export const validateUser =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    const errors: { [key: string]: string } = {};

    if (!result.success) {
      result.error.issues.forEach((err) => {
        const field = String(err.path[0]);
        errors[field] = err.message;
      });

      return res.status(400).json({ message: 'Invalid user data', errors });
    }

    req.body = result.data;
    next();
  };
