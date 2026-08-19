import Stripe from 'stripe';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';
import { handlePostPayment } from '../utils/handlePostPayment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { order_id } = req.body;
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('totalLocal,currency,paymentIntent_id')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  const converted_price = order?.totalLocal * 100;

  if (orderError || !order) {
    logger.error({ orderError }, 'Ordr not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.paymentIntent_id) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntent_id,
    );

    if (paymentIntent.status === 'succeeded') {
      return res
        .status(200)
        .json({ message: 'Payment already successful', status: 'success' });
    }

    if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_confirmation' ||
      paymentIntent.status === 'requires_action' ||
      paymentIntent.status === 'processing'
    ) {
      return res.status(200).json({
        message: 'Payment already initialized',
        client_secret: paymentIntent.client_secret, // used on frontend to confirm payment
        status: 'pending',
      });
    }

    if (paymentIntent.status === 'canceled') {
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

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: converted_price,
        currency: order.currency.toLowerCase(),
        metadata: { order_id },
      },
      {
        idempotencyKey: `order_${order_id}`,
      },
    );

    const { error: updatedOrderError } = await supabase
      .from('order')
      .update({ paymentIntent_id: paymentIntent.id })
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
      client_secret: paymentIntent.client_secret,
      paymentIntent_id: paymentIntent.id,
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

export const verifyStripePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const paymentIntent_id = req.params.paymentIntent_id as string;

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('status,paymentIntent_id,id,cart_id')
    .eq('paymentIntent_id', paymentIntent_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.status === 'pending') {
    const paymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntent_id);

    if (paymentIntent.status === 'succeeded') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('paymentIntent_id', paymentIntent_id)
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

    if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_confirmation' ||
      paymentIntent.status === 'requires_action' ||
      paymentIntent.status === 'processing'
    ) {
      return res.status(200).json({
        message:
          'verify payment from bank, a confirmation email or code has been sent if required',
        status: 'pending',
      });
    }

    if (paymentIntent.status === 'canceled') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'canceled' })
        .eq('paymentIntent_id', paymentIntent_id)
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
      return res.status(400).json({
        message: 'Payment failed or expired',
        status: 'canceled',
      });
    }
  }
  return res
    .status(200)
    .json({ message: 'payment already processed', status: order.status });
};
