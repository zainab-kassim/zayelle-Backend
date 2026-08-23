import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';
import { handlePostPayment } from '../utils/handlePostPayment';

export const initializePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const email = req.user.email;
  console.log(req.body);
  const { order_id } = req.body;
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('totalLocal,reference,currency')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }
  const currency = order.currency;

  if (order.reference) {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${order.reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );
    if (response.data.data.status === 'success') {
      return res
        .status(200)
        .json({ message: 'Payment already successful', status: 'success' });
    }
    if (response.data.data.status === 'pending') {
      return res.status(200).json({
        message: 'Payment already initialized',
        auth_url: response.data.data.authorization_url,
        status: 'pending',
      });
    }
    if (
      response.data.data.status === 'failed' ||
      response.data.data.status === 'abandoned'
    ) {
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

  const converted_price = order.totalLocal * 100;
  const reference = `ZAYELLE_${order_id}_`;
  const isProduction = process.env.NODE_ENV === 'Production';
  const frontendUrl = isProduction
    ? process.env.FRONTEND_URL
    : process.env.LOCAL_URL;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: converted_price,
        reference,
        callback_url: `${frontendUrl}/checkout`,
        metadata: {
          orderId: order_id,
          currency,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { error: updated_order_error, data: _updated_order_data } =
      await supabase
        .from('order')
        .update({ reference })
        .eq('id', order_id)
        .eq('user_id', req.user.id)
        .single();

    if (updated_order_error) {
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
      logger.error({ updated_order_error }, 'unable to make order');
      return res.status(500).json({ message: 'Unable to make order' });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      auth_url: response.data.data.authorization_url,
      currency,
      reference,
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

export const verifyPayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const { reference } = req.params;

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('status,id,cart_id')
    .eq('reference', reference)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.status === 'pending') {
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    if (data.data.status === 'success') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('reference', reference)
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
        // rollback the status so paystack can safely retry
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

    if (data.data.status === 'pending') {
      return res.status(200).json({
        message: 'Payment still pending',
        status: 'pending',
      });
    }

    if (data.data.status === 'failed' || data.data.status === 'abandoned') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: `${data.data.status}` })
        .eq('reference', reference)
        .eq('user_id', req.user.id)
        .eq('status', 'pending')
        .select('id')
        .single();

      if (updated_order_error || !updatedOrder) {
        // webhook already processed this order first, nothing left to do
        return res.status(400).json({
          message: 'Payment failed or expired',
          status: 'failed',
        });
      }

      const { error: restoreError } = await supabase.rpc(
        'increment_inventory_on_restore',
        { p_order_id: order.id },
      );
      if (restoreError) {
        logger.error(
          { error: restoreError },
          'CRITICAL: inventory restore failed',
        );
      }
      logger.error('payment failed');
      return res.status(400).json({
        message: 'Payment failed or expired',
        status: 'failed',
      });
    }
  }

  // order already left 'pending', but a stray webhook event (e.g. charge.abandoned
  // firing around a session timeout) can have flipped it before the real
  // charge.success landed — re-confirm with Paystack rather than trusting a cached status
  if (order.status !== 'success') {
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    if (data.data.status === 'success') {
      const { data: updatedOrder, error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('reference', reference)
        .eq('user_id', req.user.id)
        .neq('status', 'success')
        .select('id')
        .single();

      if (updatedOrder && !updated_order_error) {
        try {
          await handlePostPayment(order.id, order.cart_id);
        } catch (err) {
          logger.error({ err }, 'post payment error during reconciliation');
          return res
            .status(500)
            .json({ message: 'network error, please reload the page' });
        }
      }

      return res
        .status(200)
        .json({ message: 'Payment successful', status: 'success' });
    }
  }

  return res
    .status(200)
    .json({ message: 'Payment already processed', status: order.status });
};
