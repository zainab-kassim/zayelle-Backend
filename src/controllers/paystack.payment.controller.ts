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
    if (
      response.data.data.status === 'pending' ||
      response.data.data.status === 'abandoned'
    ) {
      return res.status(200).json({
        message: 'Payment already initialized',
        auth_url: response.data.data.authorization_url,
        status: 'pending',
      });
    }
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
      return res.status(500).json({ message: 'Error updating order' });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      auth_url: response.data.data.authorization_url,
      currency,
      reference,
    });
  } catch (err) {
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
    .select('status')
    .eq('reference', reference)
    .eq('user_id', req.user.id)
    .single();

  if (error || !order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  return res
    .status(200)
    .json({ message: 'order successful', status: order.status });
};
