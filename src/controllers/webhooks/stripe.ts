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

  // Payment failed — restore inventory
  if (
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'payment_intent.canceled'
  ) {
    const orderId = event.data.object.metadata.order_id;
    const status =
      event.type === 'payment_intent.canceled' ? 'canceled' : 'failed';
    const failureReason = event.data.object.last_payment_error?.code;

    // match on currency/amount too, like the succeeded handler below —
    // otherwise a stray PaymentIntent event sharing this order_id's metadata
    // (e.g. an earlier failed attempt) can flip the order before the real
    // payment_intent.succeeded for THIS charge arrives, and that success
    // update then silently no-ops since status is no longer 'pending'
    const { data: order, error: orderError } = await supabase
      .from('order')
      .update({ status: status })
      .eq('id', orderId)
      .eq('status', 'pending')
      .eq('currency', event.data.object.currency.toUpperCase())
      .eq('totalLocal', event.data.object.amount / 100)
      .select('id, cart_id')
      .single();

    if (!order || orderError) {
      logger.error({ orderError }, 'Already processed');
      return res.status(200).json({ message: 'Already processed' }); // idempotent, stop retries
    }

    const { error: restoreError } = await supabase.rpc(
      'increment_inventory_on_restore',
      {
        p_order_id: orderId,
      },
    );
    if (restoreError) {
      logger.error(
        { error: restoreError },
        'CRITICAL: inventory restore failed',
      );
    }

    // still record what was ordered even though payment didn't succeed —
    // best-effort, doesn't affect the payment status already recorded above
    try {
      await handlePostPayment(order.id, order.cart_id, { clearCart: false });
    } catch (err) {
      logger.error({ err }, 'Failed to record order items for failed order');
    }

    return res
      .status(200)
      .json({ message: 'payment failed', status: status, failureReason });
  }

  if (event.type === 'payment_intent.requires_action') {
    return res.status(200).json({
      message:
        'verify payment from bank, a confirmation email or code has been sent if required.',
      status: 'pending',
    });
  }

  if (event.type !== 'payment_intent.succeeded') {
    logger.info('event ignored');
    return res.status(200).json({ message: 'Event ignored' });
  }

  // order.checkoutSession_id stores the Checkout Session id, not this PaymentIntent's id
  // (the webhook is subscribed to payment_intent.* events, so match on metadata.order_id instead)
  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from('order')
    .update({ status: 'success' })
    .eq('status', 'pending')
    .eq('id', event.data.object.metadata.order_id)
    .eq('currency', event.data.object.currency.toUpperCase())
    .eq('totalLocal', event.data.object.amount / 100)
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
