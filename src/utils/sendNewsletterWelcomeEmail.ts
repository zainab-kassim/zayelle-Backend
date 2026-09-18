import { resend, EMAIL_FROM } from '../config/resend';
import logger from '../middleware/logger';

// best-effort — never throws, so a Resend hiccup can't fail the subscribe
export const sendNewsletterWelcomeEmail = async (to: string): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Welcome to the Zayelle Circle',
      text:
        `You're on the list. Welcome to the circle.\n\n` +
        `Early access to new collections, custom-order slots and styling notes, straight to your inbox.`,
      html:
        `<p>You're on the list. Welcome to the circle.</p>` +
        `<p>Early access to new collections, custom-order slots and styling notes, straight to your inbox.</p>`,
    });
    if (error) {
      logger.error({ error }, 'Resend rejected newsletter welcome email');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send newsletter welcome email');
  }
};
