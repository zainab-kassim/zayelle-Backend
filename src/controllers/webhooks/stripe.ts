import { Request, Response } from 'express';
import { supabase } from '../../config/db';
import stripe from 'stripe';
import { handlePostPayment } from '../../utils/handlePostPayment';

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;

  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ message: 'Event ignored' });
  }

  const paymentIntent_id = event.data.object.id;

  const { data: updatedOrder, error } = await supabase
    .from('order')
    .update({ status: ['success'] })
    .eq('paymentIntent_id', paymentIntent_id)
    .eq('status', ['pending'])
    .select('id, cart_id')
    .single();

  if (error || !updatedOrder) {
    return res.status(200).json({ message: 'Already processed' });
  }

  try {
    await handlePostPayment(updatedOrder.id, updatedOrder.cart_id);
  } catch (_err) {
    // rollback the status so Stripe can safely retry
    await supabase
      .from('order')
      .update({ status: ['pending'] })
      .eq('id', updatedOrder.id);

    return res.status(500).json({ message: 'Post payment failed, retrying' });
  }

  return res.status(200).json({ message: 'Order confirmed' });
};
