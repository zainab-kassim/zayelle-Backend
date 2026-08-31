import { resend, EMAIL_FROM } from '../config/resend';
import logger from '../middleware/logger';

/**
 * Best-effort transactional send. Never throws and never surfaces failure:
 * the /forgot-password response is always a generic 200 so it can't be used
 * to probe which emails have accounts.
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your Zayelle password',
      text:
        `Someone requested a password reset for your Zayelle account.\n\n` +
        `Reset it here (link expires in 30 minutes):\n${resetUrl}\n\n` +
        `If this wasn't you, you can safely ignore this email.`,
      html:
        `<p>Someone requested a password reset for your Zayelle account.</p>` +
        `<p><a href="${resetUrl}">Reset your password</a> ` +
        `&mdash; this link expires in 30 minutes.</p>` +
        `<p>If this wasn't you, you can safely ignore this email.</p>`,
    });
    if (error) {
      logger.error({ error }, 'Resend rejected password reset email');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send password reset email');
  }
};
