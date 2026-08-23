import { supabase } from '../config/db';
import { Request, Response } from 'express';
import { getCachedRates } from '../utils/getCachedRates';
import { getRate } from '../utils/getRate';
import logger from '../middleware/logger';

export const createorder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const user_id = req.user.id;
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = getRate(rates, currency);

  const {
    cart_id,
    street_address,
    apt_no,
    phone_number,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  const { data: existingcart, error: existingcarterror } = await supabase
    .from('carts')
    .select('id,cart_items(price)')
    .eq('user_id', user_id)
    .eq('id', cart_id)
    .single();

  if (existingcarterror || !existingcart) {
    logger.error({ existingcarterror }, 'cart not found');
    return res.status(404).json({ message: 'Cart not found' });
  }
  const total_price = existingcart.cart_items.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  const { data: neworder, error: newordererror } = await supabase
    .from('order')
    .insert({
      user_id,
      cart_id,
      total_price,
      status: 'pending',
      phone_number,
      street_address,
      apt_no,
      city,
      state,
      postal_code,
      country,
      totalLocal: parseFloat((total_price * rate).toFixed(2)),
      rate,
      currency: req.currency,
    })
    .select(
      `id,user_id(id,firstname,email),cart_id,total_price,status,phone_number,street_address,apt_no,city,state,postal_code,country,totalLocal`,
    )
    .single();

  if (newordererror || !neworder) {
    logger.error({ newordererror }, 'error creating order');
    return res.status(500).json({ message: 'Error creating order' });
  }

  return res
    .status(200)
    .json({ message: 'Order created successfully', order: neworder });
};

export const getOrderHistory = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user_id = req.user.id;

  const { data: orders, error: orderError } = await supabase
    .from('order')
    .select(`*, order_items(*, product_id(name, slug, image, description))`)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (orderError) {
    logger.error({ orderError }, 'Error fetching order history');
    return res.status(500).json({ message: 'Error fetching order history' });
  }

  // convert item prices with the rate stored on each order (locked in at checkout),
  // not today's live rate — otherwise these wouldn't match the order's own totalLocal
  const formattedOrders = orders.map((order) => ({
    ...order,
    order_items: order.order_items.map((item: { price: number }) => ({
      ...item,
      price: parseFloat((item.price * order.rate).toFixed(2)),
    })),
  }));

  return res.status(200).json({
    message: 'Order history fetched successfully',
    orders: formattedOrders,
  });
};

export const updateshippinginfo = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    order_id,
    street_address,
    apt_no,
    phone_number,
    city,
    state,
    postal_code,
    country,
  } = req.body;

  const { data: updatedorder, error: updatedordererror } = await supabase
    .from('order')
    .update({
      street_address,
      apt_no,
      phone_number,
      city,
      state,
      postal_code,
      country,
    })
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .select('street_address,apt_no,phone_number,city,state,postal_code,country')
    .single();

  if (updatedordererror) {
    logger.error({ updatedordererror }, 'Error updating shipping info');
    return res.status(500).json({ message: 'Error updating shipping info' });
  }

  return res.json({
    message: 'Shipping info updated successfully',
    order: updatedorder,
  });
};

export const getOrderDetails = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { order_id } = req.params;

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select(`*, order_items(*, product_id(name, slug, image, description))`)
    .eq('id', order_id)
    .eq('user_id', req.user.id)
    .single();

  if (orderError || !order) {
    logger.error({ orderError }, 'Order not found');
    return res.status(404).json({ message: 'Order not found' });
  }

  // convert with the rate stored on this order (locked in at checkout), not
  // today's live rate — otherwise these wouldn't match the order's own totalLocal
  const formattedOrder = {
    ...order,
    order_items: order.order_items.map((item: { price: number }) => ({
      ...item,
      price: parseFloat((item.price * order.rate).toFixed(2)),
    })),
  };

  return res.status(200).json({ order: formattedOrder });
};
