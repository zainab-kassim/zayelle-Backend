// controllers/currency.controller.ts
import { Request, Response } from 'express';

export const GetCurrency = (req: Request, res: Response) => {
  res.status(200).json({ currency: req.currency });
};
