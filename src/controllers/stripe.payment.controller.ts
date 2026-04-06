import Stripe from 'stripe';
import { Request, Response } from 'express';
import { supabase } from '../config/db';

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
