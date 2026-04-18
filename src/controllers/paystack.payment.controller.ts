import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';

export const initializePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const email = req.user.email;
  const currency = req.currency;

  const { order_id } = req.body;
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('totalLocal,reference')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ message: 'Order not found' });
  }

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

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: converted_price,
        reference,
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
      const restoreError = await supabase.rpc(
        'increment_inventory_on_restore',
        { p_order_id: order_id },
      );
      if (restoreError) {
        logger.error(
          { error: restoreError },
          'CRITICAL: inventory restore failed',
        );
      }
      return res.status(500).json({ message: 'Unable to make order' });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      auth_url: response.data.data.authorization_url,
      currency,
      reference,
    });
  } catch (err) {
    const restoreError = await supabase.rpc('increment_inventory_on_restore', {
      p_order_id: order_id,
    });
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

  const { data: order, error } = await supabase
    .from('order')
    .select('status,id')
    .eq('reference', reference)
    .eq('user_id', req.user.id)
    .single();

  if (error || !order) {
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
      const { error: updated_order_error } = await supabase
        .from('order')
        .update({ status: 'success' })
        .eq('reference', reference)
        .eq('user_id', req.user.id)
        .single();

      if (updated_order_error) {
        return res.status(500).json({ message: 'Unable to verify order' });
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
      const { error: updated_order_error } = await supabase
        .from('order')
        .update({ status: `${data.data.status}` })
        .eq('reference', reference)
        .eq('user_id', req.user.id)
        .single();

      if (updated_order_error) {
        return res.status(500).json({ message: 'Unable to verify order' });
      }

      const restoreError = await supabase.rpc(
        'increment_inventory_on_restore',
        { p_order_id: order.id },
      );
      if (restoreError) {
        logger.error(
          { error: restoreError },
          'CRITICAL: inventory restore failed',
        );
      }
      return res.status(400).json({
        message: 'Payment failed or expired',
        status: 'failed',
      });
    }
  }

  return res
    .status(200)
    .json({ message: 'order successful', status: order.status });
};
