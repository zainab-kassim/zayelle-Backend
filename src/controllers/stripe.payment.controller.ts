import Stripe from 'stripe';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';

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
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.paymentIntent_id) {
    const existingIntent = await stripe.paymentIntents.retrieve(
      order.paymentIntent_id,
    );

    if (
      existingIntent.status === 'requires_payment_method' ||
      existingIntent.status === 'requires_confirmation'
    ) {
      return res.json({ clientSecret: existingIntent.client_secret });
    }

    if (existingIntent.status === 'succeeded') {
      return res.status(400).json({ message: 'Payment already succeeded' });
    }
  }

  // 1. Decrement inventory atomically before touching Stripe
  const { error: rpcError } = await supabase.rpc(
    'decrement_inventory_on_payment',
    { p_order_id: order_id },
  );

  if (rpcError) {
    if (rpcError.message.includes('OUT_OF_STOCK')) {
      return res
        .status(400)
        .json({ message: 'One or more items are out of stock' });
    }
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
      return res.status(500).json({
        message: 'Error updating order',
      });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      client_secret: paymentIntent.client_secret,
      paymentIntent_id: paymentIntent.id,
    });
  } catch (err) {
    // Stripe failed — restore inventory
    await restoreInventory(order_id);
    logger.error({ err }, 'Stripe payment initialization failed');
    return res.status(500).json({ message: 'Payment initialization failed' });
  }
};

const restoreInventory = async (order_id: number) => {
  const { data: order } = await supabase
    .from('order')
    .select('cart_id')
    .eq('id', order_id)
    .single();

  if (!order) return;

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('cart_id', order.cart_id);

  if (!cartItems) return;

  for (const item of cartItems) {
    await supabase.rpc('increment_inventory_on_restore', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }
};

export const verifyStripePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const paymentIntent_id = req.params.paymentIntent_id as string;

  const { data: order, error } = await supabase
    .from('order')
    .select('status')
    .eq('paymentIntent_id', paymentIntent_id)
    .eq('user_id', req.user.id)
    .single();

  if (error || !order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  return res.status(200).json({ status: order.status });
};
