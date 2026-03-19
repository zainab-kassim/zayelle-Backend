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
  const { local_amount, currency, order_id } = req.body;
  const converted_price = parseInt(local_amount.replace(/,/g, '')) * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: converted_price,
    currency: currency,
    metadata: { order_id },
  });

  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from('order')
    .update({ paymentIntent_id: paymentIntent.id, currency, local_amount })
    .eq('id', order_id)
    .single();

  if (updatedOrderError) {
    return res.status(500).json({
      message: 'Error updating order with payment intent ID',
      updatedOrderError,
    });
  }

  return res.status(200).json({
    message: 'Payment initiated successfully',
    client_secret: paymentIntent.client_secret,
    paymentIntent_id: paymentIntent.id,
    updatedOrder,
  });
};

export const verifyStripePayment = async (req: Request, res: Response) => {
  const paymentIntent_id = req.params.paymentIntent_id as string;

  const verifyPayment = await stripe.paymentIntents.retrieve(paymentIntent_id);

  if (verifyPayment.status === 'succeeded') {
    const { data: updatedorderstatus, error: updatedorderstatusError } =
      await supabase
        .from('order')
        .update({ status: ['success'] })
        .eq('payment_intent_id', paymentIntent_id)
        .select()
        .single();

    if (updatedorderstatusError) {
      return res.status(500).json({
        message: 'Error updating order status',
        updatedorderstatusError,
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
