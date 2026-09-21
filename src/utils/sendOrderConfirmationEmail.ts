import { resend, EMAIL_FROM } from '../config/resend';
import logger from '../middleware/logger';

interface OrderConfirmationItem {
  name: string;
  size: string;
  quantity: number;
  price: number; // line total, already in the order's own currency
}

interface OrderConfirmationDetails {
  orderId: number;
  customerName: string;
  orderCode: string;
  items: OrderConfirmationItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  addressLines: string[];
}

// email-safe font stacks — web fonts (Fraunces/Inter) aren't reliably
// supported by mail clients, these are the closest web-safe equivalents
const SERIF = `Georgia, 'Times New Roman', serif`;
const SANS = `Helvetica, Arial, sans-serif`;

// site's own palette, matching app/globals.css / tailwind.config.ts tokens
const INK = '#17171A';
const PAPER = '#FCFBF9';
const MUTED = '#726B60';
const SURFACE = '#F6F4F1';
const LINE = '#E7E3DC';

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function getOrderUrl(orderId: number): string {
  const isProduction = process.env.NODE_ENV === 'Production';
  const base = isProduction ? process.env.FRONTEND_URL : process.env.LOCAL_URL;
  return `${base}/orders/${orderId}`;
}

function buildHtml(order: OrderConfirmationDetails): string {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0; border-bottom:1px solid ${LINE};">
            <p style="margin:0; font-family:${SERIF}; font-size:14px; color:${INK};">${item.name}</p>
            <p style="margin:2px 0 0; font-family:${SANS}; font-size:12px; color:${MUTED};">Size ${item.size} &middot; Qty ${item.quantity}</p>
          </td>
          <td style="padding:14px 0; border-bottom:1px solid ${LINE}; text-align:right; vertical-align:top; font-family:${SANS}; font-size:13px; color:${INK};">
            ${formatAmount(item.price, order.currency)}
          </td>
        </tr>`,
    )
    .join('');

  const addressHtml = order.addressLines
    .map((line) => `<span style="display:block;">${line}</span>`)
    .join('');

  return `
<div style="background-color:${SURFACE}; padding:40px 16px; font-family:${SANS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:${PAPER};">
    <tr>
      <td style="padding:32px 40px 24px; text-align:center; border-bottom:1px solid ${LINE};">
        <span style="font-family:${SERIF}; font-size:22px; letter-spacing:0.04em; color:${INK};">Zayelle</span>
      </td>
    </tr>

    <tr>
      <td style="padding:40px 40px 8px; text-align:center;">
        <img src="https://img.icons8.com/?size=100&id=kCNfpZEhheCl&format=png&color=000000" width="44" height="44" alt="" style="display:block; margin:0 auto 16px;" />
        <h1 style="font-family:${SERIF}; font-weight:normal; font-size:20px; color:${INK}; margin:0 0 8px;">Order Confirmed</h1>
        <p style="font-family:${SANS}; font-size:13px; color:${MUTED}; margin:0;">Hi ${order.customerName}, thanks for shopping with us.</p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE};">
          <tr>
            <td style="padding:16px 20px; font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:${MUTED};">Order Number</td>
            <td style="padding:16px 20px; text-align:right; font-family:${SANS}; font-size:13px; color:${INK};">${order.orderCode}</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 40px 0;">
        <p style="font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:${MUTED}; margin:0 0 4px;">Order Items</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0; font-family:${SANS}; font-size:13px; color:${MUTED};">Subtotal</td>
            <td style="padding:4px 0; text-align:right; font-family:${SANS}; font-size:13px; color:${INK};">${formatAmount(order.subtotal, order.currency)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-family:${SANS}; font-size:13px; color:${MUTED};">Shipping</td>
            <td style="padding:4px 0; text-align:right; font-family:${SANS}; font-size:13px; color:${INK};">${order.shipping > 0 ? formatAmount(order.shipping, order.currency) : 'Free'}</td>
          </tr>
          <tr>
            <td style="padding:14px 0 0; border-top:1px solid ${LINE}; font-family:${SANS}; font-size:14px; color:${INK};">Total</td>
            <td style="padding:14px 0 0; border-top:1px solid ${LINE}; text-align:right; font-family:${SANS}; font-size:16px; font-weight:bold; color:${INK};">${formatAmount(order.total, order.currency)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 40px 0;">
        <p style="font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:${MUTED}; margin:0 0 8px;">Shipping To</p>
        <p style="margin:0; font-family:${SANS}; font-size:13px; color:${INK}; line-height:1.6;">
          <span style="display:block;">${order.customerName}</span>
          ${addressHtml}
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 40px 40px; text-align:center;">
        <a href="${getOrderUrl(order.orderId)}" style="display:inline-block; background-color:${INK}; color:${PAPER}; font-family:${SANS}; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; text-decoration:none; padding:14px 32px; border-radius:999px;">View Your Order</a>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 40px; border-top:1px solid ${LINE}; text-align:center;">
        <p style="margin:0; font-family:${SANS}; font-size:11px; color:${MUTED};">Questions about your order? Just reply to this email.</p>
      </td>
    </tr>
  </table>
</div>`;
}

function buildText(order: OrderConfirmationDetails): string {
  const itemLines = order.items
    .map(
      (item) =>
        `${item.name} (Size ${item.size}) x${item.quantity}: ${formatAmount(item.price, order.currency)}`,
    )
    .join('\n');

  return (
    `Hi ${order.customerName},\n\n` +
    `Thanks for your order, here's your confirmation.\n\n` +
    `Order ${order.orderCode}\n\n${itemLines}\n\n` +
    `Subtotal: ${formatAmount(order.subtotal, order.currency)}\n` +
    `Shipping: ${order.shipping > 0 ? formatAmount(order.shipping, order.currency) : 'Free'}\n` +
    `Total: ${formatAmount(order.total, order.currency)}\n\n` +
    `Shipping to:\n${order.customerName}\n${order.addressLines.join('\n')}\n\n` +
    `View your order: ${getOrderUrl(order.orderId)}`
  );
}

// best-effort — never throws, so an email hiccup can't fail order processing
export const sendOrderConfirmationEmail = async (
  to: string,
  order: OrderConfirmationDetails,
): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Your Zayelle order ${order.orderCode} is confirmed`,
      text: buildText(order),
      html: buildHtml(order),
    });
    if (error) {
      logger.error({ error }, 'Resend rejected order confirmation email');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send order confirmation email');
  }
};
