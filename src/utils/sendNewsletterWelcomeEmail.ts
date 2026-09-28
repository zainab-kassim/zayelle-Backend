import { resend, EMAIL_FROM } from '../config/resend';
import logger from '../middleware/logger';
import {
  SERIF,
  SANS,
  INK,
  PAPER,
  MUTED,
  SURFACE,
  LINE,
  REPLY_TO,
} from './emailTheme';

function getSiteUrl(): string {
  const isProduction = process.env.NODE_ENV === 'Production';
  const base = isProduction ? process.env.FRONTEND_URL : process.env.LOCAL_URL;
  return `${base}/products?collection=new-arrivals`;
}

function buildHtml(): string {
  const siteUrl = getSiteUrl();

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
        <p style="font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:${MUTED}; margin:0 0 12px;">Welcome</p>
        <h1 style="font-family:${SERIF}; font-weight:normal; font-size:20px; color:${INK}; margin:0 0 12px;">You're On The List</h1>
        <p style="font-family:${SANS}; font-size:13px; color:${MUTED}; margin:0; line-height:1.6;">
          Welcome to the circle. Early access to new collections, custom-order slots and styling notes, straight to your inbox.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 40px 40px; text-align:center;">
        <a href="${siteUrl}" style="display:inline-block; background-color:${INK}; color:${PAPER}; font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; text-decoration:none; padding:14px 32px; border-radius:999px;">Shop New Arrivals</a>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px; border-top:1px solid ${LINE}; text-align:center;">
        <p style="margin:0; font-family:${SANS}; font-size:11px; color:${MUTED}; line-height:1.6;">
          Questions? Reply to this email or write to
          <a href="mailto:${REPLY_TO}" style="color:${INK};">${REPLY_TO}</a>.
        </p>
        <p style="margin:8px 0 0; font-family:${SANS}; font-size:10px; color:${MUTED};">This is an automated message.</p>
      </td>
    </tr>
  </table>
</div>`;
}

function buildText(): string {
  const siteUrl = getSiteUrl();
  return (
    `You're on the list. Welcome to the circle.\n\n` +
    `Early access to new collections, custom-order slots and styling notes, straight to your inbox.\n\n` +
    `Shop new arrivals: ${siteUrl}\n\n` +
    `Questions? Reply to this email or write to ${REPLY_TO}.\n` +
    `This is an automated message.`
  );
}

// best-effort, never throws, so a Resend hiccup can't fail the subscribe
export const sendNewsletterWelcomeEmail = async (to: string): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      replyTo: REPLY_TO,
      subject: 'Welcome to the Zayelle Circle',
      text: buildText(),
      html: buildHtml(),
    });
    if (error) {
      logger.error({ error }, 'Resend rejected newsletter welcome email');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send newsletter welcome email');
  }
};
