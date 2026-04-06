import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../config/db';

export const initializePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const email = req.user.email;
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const currency = req.currency;

  const { order_id } = req.body;
  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('totalLocal')
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const converted_price = order.totalLocal * 100;
  const reference = `ZAYELLE_${order_id}_${Date.now()}`;

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount: converted_price,
      reference,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const { error: updated_order_error } = await supabase
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
