import { Request, Response } from 'express';
import { supabase } from '../../config/db';
import { createHmac } from 'crypto';
import { handlePostPayment } from '../../utils/handlePostPayment';

export const paystackWebhook = async (req: Request, res: Response) => {
  // Verify the request actually came from Paystack
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  const hash = createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid' });
  }

  const { event, data } = req.body;
  // Payment failed — restore inventory
  if (event === 'charge.failed') {
    const orderId = data.metadata.orderId;

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
          await supabase.rpc('increment_inventory', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }
    }
    return res.status(200).json({ message: 'Inventory restored' });
  }

  if (event !== 'charge.success') {
    return res.status(200).json({ message: 'Event ignored' });
  }

  const reference = data.reference;

  const { data: updatedorderstatus, error: updatedorderstatuserror } =
    await supabase
      .from('order')
      .update({ status: ['success'] })
      .eq('reference', reference)
      .eq('status', ['pending'])
      .eq('id', data.metadata.orderId)
      .eq('currency', data.metadata.currency)
      .eq('totalLocal', data.amount / 100)
      .select(`id,cart_id`)
      .single();

  if (updatedorderstatuserror || !updatedorderstatus) {
    return res.status(200).json({ message: 'Payment already processed' });
  }

  try {
    await handlePostPayment(updatedorderstatus.id, updatedorderstatus.cart_id);
  } catch (_err) {
    // rollback the status so paystack can safely retry
    await supabase
      .from('order')
      .update({ status: ['pending'] })
      .eq('id', updatedorderstatus.id);

    return res.status(500).json({ message: 'Post payment failed, retrying' });
  }

  return res.status(200).json({ message: 'Order confirmed' });
};
