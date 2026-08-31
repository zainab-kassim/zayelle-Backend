import { Request, Response } from 'express';
import { supabase } from '../../config/db';
import { createHmac } from 'crypto';
import { handlePostPayment } from '../../utils/handlePostPayment';
import logger from '../../middleware/logger';

export const paystackWebhook = async (req: Request, res: Response) => {
  // Verify the request actually came from Paystack
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  // TEMP: diagnosing 401s on the live webhook — is it the key or the raw body?
  logger.info(
    {
      isBuffer: Buffer.isBuffer(req.body),
      bodyLen: req.body?.length,
      contentType: req.headers['content-type'],
      keySet: !!process.env.PAYSTACK_SECRET_KEY,
      keyTrimmedMatches:
        process.env.PAYSTACK_SECRET_KEY ===
        process.env.PAYSTACK_SECRET_KEY?.trim(),
      keyPrefix: process.env.PAYSTACK_SECRET_KEY?.slice(0, 8),
    },
    'paystack webhook debug',
  );

  const hash = createHmac('sha512', secret).update(req.body).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    logger.warn(
      {
        computedPrefix: hash.slice(0, 12),
        receivedPrefix: String(req.headers['x-paystack-signature'] ?? '').slice(
          0,
          12,
        ),
      },
      'paystack webhook signature mismatch (401)',
    );
    return res.status(401).json({ message: 'Invalid' });
  }

  const event = JSON.parse(req.body.toString());
  const { data } = event;
  console.log('charge.abandoned event received', event.event);
  // Payment failed — restore inventory
  if (event.event === 'charge.failed') {
    const orderId = data.metadata.orderId;

    // match on reference/currency/amount too, like charge.success below —
    // otherwise a stray event sharing this order's metadata can flip the
    // order before the real charge.success for THIS attempt arrives, and
    // that success update then silently no-ops since status isn't 'pending'
    const { data: order, error } = await supabase
      .from('order')
      .update({ status: 'failed' })
      .eq('id', orderId)
      .eq('status', 'pending')
      .eq('reference', data.reference)
      .eq('currency', data.metadata.currency)
      .eq('totalLocal', data.amount / 100)
      .select('id, cart_id')
      .single();

    if (!order || error) {
      return res.status(200).json({ message: 'Already processed' }); // idempotent, stop retries
    }

    const restoreError = await supabase.rpc('increment_inventory_on_restore', {
      p_order_id: orderId,
    });
    if (restoreError) {
      logger.error(
        { error: restoreError },
        'CRITICAL: inventory restore failed',
      );
    }

    // still record what was ordered even though payment didn't succeed —
    // best-effort, doesn't affect the payment status already recorded above
    try {
      await handlePostPayment(order.id, order.cart_id, { clearCart: false });
    } catch (err) {
      logger.error({ err }, 'Failed to record order items for failed order');
    }

    return res
      .status(200)
      .json({ message: 'payment failed', status: 'failed' });
  }

  if (event.event === 'charge.abandoned') {
    console.log('charge.abandoned event received', event.event);
    const orderId = data.metadata.orderId;

    const { data: order, error } = await supabase
      .from('order')
      .update({ status: 'abandoned' })
      .eq('id', orderId)
      .eq('status', 'pending')
      .eq('reference', data.reference)
      .eq('currency', data.metadata.currency)
      .eq('totalLocal', data.amount / 100)
      .select('id, cart_id')
      .single();

    if (!order || error) {
      return res.status(200).json({ message: 'Already processed' }); // idempotent, stop retries
    }

    const { error: restoreError } = await supabase.rpc(
      'increment_inventory_on_restore',
      { p_order_id: orderId },
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
      await handlePostPayment(order.id, order.cart_id, { clearCart: false });
    } catch (err) {
      logger.error({ err }, 'Failed to record order items for abandoned order');
    }

    return res
      .status(200)
      .json({ message: 'payment session timed out', status: 'abandoned' });
  }

  if (event.event !== 'charge.success') {
    logger.info('Event ignored');
    return res.status(200).json({ message: 'Event ignored' }); // always 200 to stop retries
  }

  const reference = data.reference;

  const { data: updatedorderstatus, error: updatedorderstatuserror } =
    await supabase
      .from('order')
      .update({ status: 'success' })
      .eq('reference', reference)
      .eq('status', 'pending')
      .eq('id', data.metadata.orderId)
      .eq('currency', data.metadata.currency)
      .eq('totalLocal', data.amount / 100)
      .select(`id,cart_id`)
      .single();

  if (updatedorderstatuserror || !updatedorderstatus) {
    logger.error({ updatedorderstatuserror }, 'Payment already processed');
    return res.status(200).json({ message: 'Payment already processed' });
  }

  try {
    await handlePostPayment(updatedorderstatus.id, updatedorderstatus.cart_id);
  } catch (err) {
    // rollback the status so paystack can safely retry
    await supabase
      .from('order')
      .update({ status: 'pending' })
      .eq('id', updatedorderstatus.id);
    logger.error({ err }, 'Post payment failed, retrying');
    return res.status(500).json({ message: 'Post payment failed, retrying' });
  }

  return res.status(200).json({ message: 'Order confirmed' });
};
