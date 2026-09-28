import { resend, EMAIL_FROM } from '../config/resend';
import logger from '../middleware/logger';
import { SERIF, SANS, INK, PAPER, MUTED, SURFACE, LINE } from './emailTheme';

function buildHtml(resetUrl: string): string {
  return `
<div style="background-color:${SURFACE}; padding:40px 16px; font-family:${SANS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background-color:${PAPER};">
    <tr>
      <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid ${LINE};">
        <span style="font-family:${SERIF}; font-size:22px; letter-spacing:0.04em; color:${INK};">Zayelle</span>
      </td>
    </tr>

    <tr>
      <td style="padding:40px 40px 8px; text-align:center;">
        <p style="font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:${MUTED}; margin:0 0 12px;">Password Reset</p>
        <h1 style="font-family:${SERIF}; font-weight:normal; font-size:20px; color:${INK}; margin:0 0 12px;">Reset Your Password</h1>
        <p style="font-family:${SANS}; font-size:13px; color:${MUTED}; margin:0; line-height:1.6;">
          We received a request to reset the password for your Zayelle account. Click the button below to choose a new one.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 40px 8px; text-align:center;">
        <a href="${resetUrl}" style="display:inline-block; background-color:${INK}; color:${PAPER}; font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; text-decoration:none; padding:14px 32px; border-radius:999px;">Reset Password</a>
      </td>
    </tr>

    <tr>
      <td style="padding:8px 40px 0; text-align:center;">
        <p style="font-family:${SANS}; font-size:12px; color:${MUTED}; margin:0;">This link expires in 30 minutes.</p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 40px 32px; text-align:center;">
        <p style="font-family:${SANS}; font-size:11px; color:${MUTED}; margin:0 0 4px;">Or paste this link into your browser</p>
        <p style="font-family:${SANS}; font-size:11px; color:${INK}; margin:0; word-break:break-all;">${resetUrl}</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px; border-top:1px solid ${LINE}; text-align:center;">
        <p style="margin:0; font-family:${SANS}; font-size:11px; color:${MUTED}; line-height:1.6;">
          If you did not request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </td>
    </tr>
  </table>
</div>`;
}

function buildText(resetUrl: string): string {
  return (
    `Someone requested a password reset for your Zayelle account.\n\n` +
    `Reset it here (link expires in 30 minutes):\n${resetUrl}\n\n` +
    `If you did not request this, you can safely ignore this email. Your password will remain unchanged.`
  );
}

// best-effort, never throws; /forgot-password always returns a generic 200
// so it can't be used to check which emails have accounts
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your Zayelle password',
      text: buildText(resetUrl),
      html: buildHtml(resetUrl),
    });
    if (error) {
      logger.error({ error }, 'Resend rejected password reset email');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send password reset email');
  }
};
