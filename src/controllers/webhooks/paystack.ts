import { Request, Response } from 'express';
import { supabase } from '../../config/db';
import { createHmac } from 'crypto';
import { handlePostPayment } from '../../utils/handlePostPayment';

export const paystackWebhook = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // Verify the request actually came from Paystack
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  const hash = createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ message: 'Invalid' });
  }

  // Only care about successful charges
  const { event, data } = req.body;
  if (event !== 'charge.success') {
    return res.status(200).json({ message: 'Event ignored' });
  }

  const reference = data.reference;

  const { data: updatedorderstatus, error: updatedorderstatuserror } =
    await supabase
      .from('order')
      .update({ status: ['success'] })
      .eq('reference', reference)
      .eq('user_id', req.user.id)
      .eq('status', ['pending'])
      .select(`id,cart_id`)
      .single();

  if (updatedorderstatuserror || !updatedorderstatus) {
    return res.status(200).json({ message: 'Payment already processed' });
  }

  await handlePostPayment(updatedorderstatus.id, updatedorderstatus.cart_id);

  return res.status(200).json({ message: 'Order confirmed' });
};
