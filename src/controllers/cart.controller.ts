import { supabase } from '../config/db';
import { Request, Response } from 'express';
import { getCachedRates } from '../utils/getCachedRates';

export const addtocart = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const userid = req.user.id;
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];

  const { productid, quantity, size } = req.body;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price')
    .eq('id', productid)
    .single();

  if (productError) {
    return res.status(404).json({ message: 'invalid product' });
  }
  const { data: existingcart } = await supabase
    .from('carts')
    .select()
    .eq('user_id', userid)
    .select()
    .single();

  if (existingcart) {
    const { data: existingcartitems, error: existingcartitemserror } =
      await supabase
        .from('cart_items')
        .select()
        .eq('cart_id', existingcart.id)
        .eq('product_id', productid)
        .eq('size', size)
        .single();

    if (existingcartitemserror && existingcartitemserror.code !== 'PGRST116') {
      return res.status(500).json({
        message: 'Error checking existing cart items',
      });
    }

    if (existingcartitems) {
      const updatedQuantity = existingcartitems.quantity + 1;
      const updatedPrice = product.price * updatedQuantity;

      const { data: updatedCartItem, error: updateCartItemError } =
        await supabase
          .from('cart_items')
          .update({ quantity: updatedQuantity, price: updatedPrice })
          .select('id,quantity, price')
          .eq('id', existingcartitems.id)
          .single();

      if (updateCartItemError || !updatedCartItem) {
        return res.status(500).json({
          message: 'Error updating cart item quantity',
        });
      }

      return res.status(200).json({
        message: 'Cart item quantity updated successfully',
        updatedCartItem,
        localprice: updatedCartItem.price * rate,
        currency,
      });
    }

    const { data: cartitem, error: cartitemerror } = await supabase
      .from('cart_items')
      .insert({
        cart_id: existingcart.id,
        product_id: productid,
        quantity,
        price: product.price * quantity,
        size,
        unitprice: product.price,
      })
      .select(`id,product_id(name,slug,image), quantity, price, size`)
      .single();

    if (cartitemerror || !cartitem) {
      return res.status(500).json({ message: 'Error adding item to cart' });
    }

    return res.status(200).json({
      message: 'Item added to cart successfully',
      cartitem,
      localprice: cartitem.price * rate,
      currency,
    });
  }

  const { data: newcart, error: newcarterror } = await supabase
    .from('carts')
    .insert({
      user_id: userid,
    })
    .select('id')
    .single();

  if (newcarterror || !newcart) {
    return res
      .status(500)
      .json({ message: 'Error creating new cart', newcart });
  }

  const { data: cartitem, error: cartitemerror } = await supabase
    .from('cart_items')
    .insert({
      cart_id: newcart.id,
      product_id: productid,
      quantity,
      price: product.price * quantity,
      size,
      unitprice: product.price,
    })
    .select(`id,product_id(name,slug,image), quantity, price, size`)
    .single();

  if (cartitemerror || !cartitem) {
    return res.status(500).json({ message: 'Error adding item to cart' });
  }

  return res.status(200).json({
    message: 'Item added to new cart successfully',
    cartitem,
    localprice: cartitem.price * rate,
    currency,
  });
};

export const updatecartquantity = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user_id = req.user.id;
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];

  const { cartitemid, quantity } = req.body;
  const { data: existingCartItem, error: existingCartItemError } =
    await supabase
      .from('cart_items')
      .select('id, unitprice, cart!inner(user_id)')
      .eq('id', cartitemid)
      .eq('cart.user_id', user_id)
      .single();

  if (existingCartItemError || !existingCartItem) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  const newPrice = existingCartItem.unitprice * quantity;

  const { data: updatedCartItem, error: updateCartItemError } = await supabase
    .from('cart_items')
    .update({ quantity, price: newPrice })
    .eq('id', cartitemid)
    .select('id, quantity, price')
    .single();

  if (updateCartItemError || !updatedCartItem) {
    return res.status(500).json({
      message: 'Error updating cart item quantity',
    });
  }

  return res.status(200).json({
    message: 'quantity updated successfully',
    updatedCartItem,
    localprice: updatedCartItem.price * rate,
    currency,
  });
};

export const deletecartitem = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const cartitemid = req.body.cartitemid;

  const { data: cart, error: carterror } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', req.user.id)
    .single();

  if (carterror || !cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const { data: deletedcartitem, error: deletedcartitemerror } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartitemid)
    .eq('cart_id', cart.id)
    .select()
    .single();

  if (deletedcartitemerror || !deletedcartitem) {
    return res.status(500).json({ message: 'Error deleting cart item' });
  }

  return res.status(200).json({
    message: 'Cart item deleted successfully',
  });
};

export const getcart = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const userid = req.user.id;
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];

  const { data: existingcart, error: existingcarterror } = await supabase
    .from('carts')
    .select(`*,user_id(firstname)`)
    .eq('user_id', userid)
    .single();
  if (existingcarterror || !existingcart) {
    return res.status(404).json({ message: 'Cart not found' });
  }
  const { data: cartitems, error: cartitemserror } = await supabase
    .from('cart_items')
    .select(`*,product_id(name,slug,image,description)`)
    .eq('cart_id', existingcart.id);

  if (cartitemserror) {
    return res.status(500).json({ message: 'Error retrieving cart items' });
  }

  const convertedItems = cartitems.map((item) => ({
    ...item,
    price: Math.round(item.price * rate),
  }));

  const total_price = cartitems.reduce((sum, item) => sum + item.price, 0);

  return res.status(200).json({
    message: 'Cart items retrieved successfully',
    cartitems: convertedItems,
    totalLocal: Math.round(total_price * rate),
    total_price,
    currency,
    firstname: existingcart.user_id.firstname,
  });
};
