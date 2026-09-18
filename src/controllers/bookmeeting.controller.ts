import { Request, Response } from 'express';
import logger from '../middleware/logger';

export const BookMeeting = async (req: Request, res: Response) => {
  // avoid shadowing the global Date constructor
  const { Username, Date: bookingDate, Time, UserEmail } = req.body;

  const makeRes = await fetch(process.env.MAKE_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-make-apikey': process.env.MAKE_API_KEY!,
    },
    body: JSON.stringify({
      Username,
      Date: bookingDate,
      Time,
      UserEmail,
    }),
  });

  if (!makeRes.ok) {
    logger.error(
      { status: makeRes.status },
      'Booking webhook returned a non-OK response',
    );
    return res
      .status(502)
      .json({ message: 'Something went wrong booking your consultation' });
  }

  const result = await makeRes.json();
  res.status(200).json(result);
};
