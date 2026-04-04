import Stripe from 'stripe';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
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
    .select('totalLocal,currency')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();
  const converted_price = order?.totalLocal * 100;

  if (orderError || !order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: converted_price,
    currency: order.currency.toLowerCase(),
    metadata: { order_id },
  });

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
    message: 'Payment made successfully',
    client_secret: paymentIntent.client_secret,
    paymentIntent_id: paymentIntent.id,
  });
};

export const verifyStripePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const paymentIntent_id = req.params.paymentIntent_id as string;

  const verifyPayment = await stripe.paymentIntents.retrieve(paymentIntent_id);

  if (verifyPayment.status === 'succeeded') {
    const { data: updatedorderstatus, error: updatedorderstatusError } =
      await supabase
        .from('order')
        .update({ status: ['success'] })
        .eq('paymentIntent_id', paymentIntent_id)
        .eq('user_id', req.user.id)
        .eq('status', ['pending'])
        .select()
        .single();

    if (updatedorderstatusError || !updatedorderstatus) {
      return res.status(200).json({
        message: 'payment already processed',
      });
    }
    const cart_id = updatedorderstatus.cart_id;
    const order_id = updatedorderstatus.id;

    await handlePostPayment(order_id, cart_id);

    return res.status(200).json({ message: 'Order successful' });
  } else {
    return res.status(400).json({ message: 'Payment not successful' });
  }
};
