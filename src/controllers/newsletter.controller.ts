import { Request, Response } from 'express';
import { subscribeToNewsletter } from '../services/newsletter.service';
import { sendNewsletterWelcomeEmail } from '../utils/sendNewsletterWelcomeEmail';

export const Subscribe = async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await subscribeToNewsletter(email);

  if (result.status === 'error') {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  // Only email first-time subscribers — re-submitting an existing email
  // still succeeds, but doesn't send a second welcome email.
  if (result.status === 'subscribed') {
    await sendNewsletterWelcomeEmail(email);
  }

  res
    .status(200)
    .json({ message: "You're on the list. Welcome to the circle." });
};
