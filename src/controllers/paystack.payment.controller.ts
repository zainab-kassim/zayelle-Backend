import axios from 'axios';
import { Request, Response } from 'express';
import { supabase } from '../config/db';
import logger from '../middleware/logger';

export const initializePayment = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
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

  // 1. Decrement inventory atomically via RPC before touching payment
  const { error: rpcError } = await supabase.rpc(
    'decrement_inventory_on_payment',
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
      return res.status(500).json({ message: 'Error updating order' });
    }

    return res.status(200).json({
      message: 'Payment initialized successfully',
      auth_url: response.data.data.authorization_url,
      currency,
      reference,
    });
  } catch (err) {
    // Paystack initialization failed — restore inventory
    await restoreInventory(order_id);
    logger.error({ error: err }, 'Payment initialization failed');
    return res.status(500).json({ message: 'Error initializing payment' });
  }
};

// Compensating function — adds stock back if payment initiation fails
const restoreInventory = async (order_id: number) => {
  const { data: order } = await supabase
    .from('order')
    .select('cart_id')
    .eq('id', order_id)
    .single();

  if (!order) return;

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('cart_id', order.cart_id);

  if (!cartItems) return;

  for (const item of cartItems) {
    await supabase
      .from('products')
      .update({ quantity: supabase.rpc('increment', { x: item.quantity }) })
      .eq('id', item.product_id);
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
