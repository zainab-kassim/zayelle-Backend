import { supabase } from '../config/db';
import { Request, Response } from 'express';

export const createorder = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const user_id = req.user.id;
  const {
    cart_id,
    total_price,
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
    .select('id')
    .eq('user_id', user_id)
    .single();

  console.log(existingcarterror);
  if (existingcarterror || !existingcart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const { data: neworder, error: newordererror } = await supabase
    .from('order')
    .insert({
      user_id,
      cart_id,
      total_price,
      status: ['pending'],
      phone_number,
      street_address,
      apt_no,
      city,
      state,
      postal_code,
      country,
    })
    .select(
      `id,user_id(id,firstname,email),cart_id,total_price,status,phone_number,street_address,apt_no,city,state,postal_code,country`,
    )
    .single();

  console.log(newordererror);
  if (newordererror || !neworder) {
    return res.status(500).json({ message: 'Error creating order' });
  }

  return res
    .status(200)
    .json({ message: 'Order created successfully', order: neworder });
};

export const getorderhistory = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user_id = req.user.id;

  const { data: orders, error } = await supabase
    .from('order')
    .select(`*, order_items(*, product_id(name, slug, image, description))`)
    .eq('user_id', user_id)
    .contains('status', ['success']);

  if (error) {
    return res.status(500).json({ message: 'Error fetching order history' });
  }

  return res
    .status(200)
    .json({ message: 'Order history fetched successfully', orders });
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
    return res.status(500).json({ message: 'Error updating shipping info' });
  }

  return res.json({
    message: 'Shipping info updated successfully',
    order: updatedorder,
  });
};
