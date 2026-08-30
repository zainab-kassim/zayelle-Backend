import { Request, Response } from 'express';
import { supabase } from '../../config/db';
import stripe from 'stripe';
import { handlePostPayment } from '../../utils/handlePostPayment';
import logger from '../../middleware/logger';

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;

  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  // ── Abandoned / timed-out checkout → cancel the order, restore inventory ──
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;

    const { data: order, error: orderError } = await supabase
      .from('order')
      .update({ status: 'canceled' })
      .eq('checkoutSession_id', session.id)
      .eq('status', 'pending')
      .select('id')
      .single();

    if (!order || orderError) {
      // already resolved (paid, verified, or handled on a previous delivery)
      return res.status(200).json({ message: 'Already processed' });
    }

    const { error: restoreError } = await supabase.rpc(
      'increment_inventory_on_restore',
      { p_order_id: order.id },
    );
    if (restoreError) {
      logger.error(
        { error: restoreError },
        'CRITICAL: inventory restore failed',
      );
    }

    // leave the cart intact so the user can start a fresh checkout
    return res
      .status(200)
      .json({ message: 'Checkout expired', status: 'canceled' });
  }

  // ── Async payment method failed (bank debit etc.) → restore inventory ──
  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;

    const { data: order, error: orderError } = await supabase
      .from('order')
      .update({ status: 'failed' })
      .eq('checkoutSession_id', session.id)
      .eq('status', 'pending')
      .select('id, cart_id')
      .single();

    if (!order || orderError) {
      return res.status(200).json({ message: 'Already processed' });
    }

    const { error: restoreError } = await supabase.rpc(
      'increment_inventory_on_restore',
      { p_order_id: order.id },
    );
    if (restoreError) {
      logger.error(
        { error: restoreError },
        'CRITICAL: inventory restore failed',
      );
    }

    // still record what was ordered — best effort, keeps the cart
    try {
      await handlePostPayment(order.id, order.cart_id, { clearCart: false });
    } catch (err) {
      logger.error({ err }, 'Failed to record order items for failed order');
    }

    return res
      .status(200)
      .json({ message: 'payment failed', status: 'failed' });
  }

  // ── Anything else we don't act on here ──
  if (event.type !== 'checkout.session.completed') {
    logger.info('event ignored');
    return res.status(200).json({ message: 'Event ignored' });
  }

  // ── checkout.session.completed ──
  const session = event.data.object;

  // card payments settle synchronously (payment_status 'paid'); async methods
  // complete the session first and settle later via
  // checkout.session.async_payment_succeeded — handle that too if you enable them
  if (session.payment_status !== 'paid') {
    return res
      .status(200)
      .json({ message: 'Awaiting payment', status: 'pending' });
  }

  // checkoutSession_id holds this exact cs_… id (stored at session creation) —
  // a unique per-attempt match, so no amount/currency guard needed
  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from('order')
    .update({ status: 'success' })
    .eq('checkoutSession_id', session.id)
    .eq('status', 'pending')
    .select('id, cart_id')
    .single();

  if (updatedOrderError || !updatedOrder) {
    logger.error({ updatedOrderError }, 'Already processed');
    return res.status(200).json({ message: 'Already processed' });
  }

  try {
    await handlePostPayment(updatedOrder.id, updatedOrder.cart_id);
  } catch (err) {
    // rollback the status so Stripe can safely retry
    await supabase
      .from('order')
      .update({ status: 'pending' })
      .eq('id', updatedOrder.id);
    logger.error({ err }, 'Post payment failed, retrying');
    return res.status(500).json({ message: 'Post payment failed, retrying' });
  }

  return res.status(200).json({ message: 'Order confirmed' });
};
