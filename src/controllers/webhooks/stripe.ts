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

  // Payment failed — restore inventory
  if (event.type === 'payment_intent.payment_failed') {
    const orderId = event.data.object.metadata.order_id;

    const { data: order } = await supabase
      .from('order')
      .select('cart_id')
      .eq('id', orderId)
      .single();

    if (order) {
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('cart_id', order.cart_id);

      if (cartItems) {
        for (const item of cartItems) {
          await supabase.rpc('increment_inventory_on_restore', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }
    }

    return res.status(200).json({ message: 'Inventory restored' });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ message: 'Event ignored' });
  }

  const paymentIntent_id = event.data.object.id;

  const { data: updatedOrder, error } = await supabase
    .from('order')
    .update({ status: 'success' })
    .eq('paymentIntent_id', paymentIntent_id)
    .eq('status', 'pending')
    .eq('id', event.data.object.metadata.order_id)
    .eq('currency', event.data.object.currency.toUpperCase())
    .eq('totalLocal', event.data.object.amount / 100)
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
      .update({ status: 'pending' })
      .eq('id', updatedOrder.id);

    return res.status(500).json({ message: 'Post payment failed, retrying' });
  }

  return res.status(200).json({ message: 'Order confirmed' });
};
