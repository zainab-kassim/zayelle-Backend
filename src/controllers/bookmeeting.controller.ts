import { Request, Response } from 'express';

export const BookMeeting = async (req: Request, res: Response) => {
  const { Username, Date, Time, UserEmail } = req.body;

  const makeRes = await fetch(process.env.MAKE_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-make-apikey': process.env.MAKE_API_KEY!,
    },
    body: JSON.stringify({ Username, Date, Time, UserEmail }),
  });

  const result = await makeRes.json();
  res.status(200).json(result);
};
