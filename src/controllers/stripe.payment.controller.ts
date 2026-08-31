import Stripe from 'stripe';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';
import { handlePostPayment } from '../utils/handlePostPayment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover',
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { order_id } = req.body;
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('totalLocal,currency,checkoutSession_id')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  const converted_price = order.totalLocal * 100;

  if (order.checkoutSession_id) {
    const session = await stripe.checkout.sessions.retrieve(
      order.checkoutSession_id,
    );

    if (session.payment_status === 'paid') {
      return res
        .status(200)
        .json({ message: 'Payment already successful', status: 'success' });
    }

    if (session.status === 'open') {
      return res.status(200).json({
        message: 'Payment already initialized',
        url: session.url, // used on frontend to redirect to Stripe Checkout
        status: 'pending',
      });
    }

    if (session.status === 'expired') {
      return res.status(400).json({
        message: 'This order has expired, please start a new checkout',
      });
    }
  }

  const { error: rpcError } = await supabase.rpc(
    'decrement_inventory_on_checkout',
    {
      p_order_id: order_id,
    },
  );

  if (rpcError) {
    if (rpcError.message.includes('OUT_OF_STOCK')) {
      logger.info('OUT OF STOCK');
      return res
        .status(400)
        .json({ message: 'One or more items are out of stock' });
    }
    logger.error(
      { error: rpcError },
      'Failed to decrement inventory on checkout',
    );
    return res.status(500).json({ message: 'Failed to process inventory' });
  }

  const isProduction = process.env.NODE_ENV === 'Production';
  const frontendUrl = isProduction
    ? process.env.FRONTEND_URL
    : process.env.LOCAL_URL;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: order.currency.toLowerCase(),
              product_data: { name: `Zayelle order #${order_id}` },
              unit_amount: converted_price,
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/checkout?canceled=1&order_id=${order_id}&provider=stripe`,
        metadata: { order_id },
        // abandoned/timed-out sessions fire checkout.session.expired at this
        // time, which the webhook uses to restore inventory (Stripe floor: 30m)
        expires_at: Math.floor(Date.now() / 1000) + 35 * 60,
      },
      {
        idempotencyKey: `order_${order_id}`,
      },
    );

    const { error: updatedOrderError } = await supabase
      .from('order')
      .update({ checkoutSession_id: session.id })
      .eq('id', order_id)
      .eq('user_id', req.user.id)
      .single();

    if (updatedOrderError) {
      const { error: restoreError } = await supabase.rpc(
        'increment_inventory_on_restore',
        { p_order_id: order_id },
      );
      if (restoreError) {
        logger.error(
          { error: restoreError },
          'CRITICAL: inventory restore failed',
        );
      }
      logger.error({ updatedOrderError }, 'unable to make order');
      return res.status(500).json({ message: 'Unable to make order' });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    const { error: restoreError } = await supabase.rpc(
      'increment_inventory_on_restore',
      {
        p_order_id: order_id,
      },
    );
    if (restoreError) {
      logger.error(
        { error: restoreError },
        'CRITICAL: inventory restore failed',
      );
    }
    logger.error({ error: err }, 'Payment initialization failed');
    return res.status(500).json({ message: 'Error initializing payment' });
  }
};

export const verifyCheckoutSession = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const session_id = req.params.session_id as string;

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('status,checkoutSession_id,id,cart_id')
    .eq('checkoutSession_id', session_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.status === 'pending') {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('checkoutSession_id', session_id)
        .eq('user_id', req.user.id)
        .eq('status', 'pending')
        .select('id')
        .single();

      if (updated_order_error || !updatedOrder) {
        // webhook already processed this order first, nothing left to do
        return res
          .status(200)
          .json({ message: 'Payment successful', status: 'success' });
      }

      try {
        await handlePostPayment(order.id, order.cart_id);
      } catch (err) {
        // rollback the status so stripe can safely retry
        await supabase
          .from('order')
          .update({ status: 'pending' })
          .eq('id', order.id);
        logger.error({ err }, 'post payment error');
        return res
          .status(500)
          .json({ message: 'network error, please reload the page' });
      }

      return res
        .status(200)
        .json({ message: 'Payment successful', status: 'success' });
    }

    if (session.status === 'expired') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'canceled' })
        .eq('checkoutSession_id', session_id)
        .eq('user_id', req.user.id)
        .eq('status', 'pending')
        .select('id')
        .single();

      if (updated_order_error || !updatedOrder) {
        // webhook already processed this order first, nothing left to do
        return res.status(400).json({
          message: 'Payment failed or expired',
          status: 'canceled',
        });
      }

      const { error: restoreError } = await supabase.rpc(
        'increment_inventory_on_restore',
        {
          p_order_id: order.id,
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
        await handlePostPayment(order.id, order.cart_id, {
          clearCart: false,
        });
      } catch (err) {
        logger.error({ err }, 'Failed to record order items for expired order');
      }

      return res.status(400).json({
        message: 'Payment failed or expired',
        status: 'canceled',
      });
    }

    return res.status(200).json({
      message: 'verify payment from bank, or complete checkout in Stripe',
      status: 'pending',
    });
  }

  // order already left 'pending', but a stray webhook event (e.g. a failed/canceled
  // PaymentIntent racing the successful one) can have flipped it before the real
  // success landed — re-confirm with Stripe rather than trusting a cached bad status
  if (order.status !== 'success') {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('checkoutSession_id', session_id)
        .eq('user_id', req.user.id)
        .neq('status', 'success')
        .select('id')
        .single();

      if (updatedOrder && !updated_order_error) {
        try {
          await handlePostPayment(order.id, order.cart_id);
        } catch (err) {
          logger.error({ err }, 'post payment error during reconciliation');
          return res
            .status(500)
            .json({ message: 'network error, please reload the page' });
        }
      }

      return res
        .status(200)
        .json({ message: 'Payment successful', status: 'success' });
    }
  }

  return res
    .status(200)
    .json({ message: 'payment already processed', status: order.status });
};

// Called by the frontend when the user backs out of Stripe Checkout (lands on
// cancel_url). Restores inventory immediately instead of waiting ~35m for the
// checkout.session.expired webhook. That webhook still fires as the backstop for
// exits this path misses (tab closed, connection dropped).
export const cancelCheckout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { order_id } = req.body;

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('id,status,checkoutSession_id')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  if (!order.checkoutSession_id || order.status !== 'pending') {
    // never checked out, or already resolved (paid / canceled / expired)
    return res
      .status(200)
      .json({ message: 'Nothing to cancel', status: order.status });
  }

  // don't cancel a session that actually got paid (e.g. completed in another tab)
  const session = await stripe.checkout.sessions.retrieve(
    order.checkoutSession_id,
  );
  if (session.payment_status === 'paid') {
    return res
      .status(200)
      .json({ message: 'Payment already completed', status: 'success' });
  }

  // flip to canceled — guarded on 'pending' so it's a no-op if the
  // checkout.session.expired webhook raced us here first
  const { data: canceled, error: cancelError } = await supabase
    .from('order')
    .update({ status: 'canceled' })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id')
    .single();

  if (canceled && !cancelError) {
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
  }

  // close the session on Stripe's side too so it can't be paid later; this
  // fires checkout.session.expired, which the webhook sees as already handled
  if (session.status === 'open') {
    try {
      await stripe.checkout.sessions.expire(order.checkoutSession_id);
    } catch (err) {
      logger.error({ err }, 'Failed to expire checkout session on cancel');
    }
  }

  // leave the cart intact so the user can start a fresh checkout
  return res
    .status(200)
    .json({ message: 'Checkout canceled', status: 'canceled' });
};
