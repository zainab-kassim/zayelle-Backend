import { supabase } from '../config/db';
import { Request, Response } from 'express';

export const addtocart = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const userid = req.user.id;
  const { productid, quantity, size, unitprice } = req.body;

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
      const updatedQuantity = parseInt(existingcartitems.quantity) + 1;
      const updatedPrice = (
        parseInt(unitprice.replace(/,/g, '')) * updatedQuantity
      ).toLocaleString('en-US');

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

      console.log(updateCartItemError);

      return res.status(200).json({
        message: 'Cart item quantity updated successfully',
        updatedCartItem,
      });
    }

    const { data: cartitem, error: cartitemerror } = await supabase
      .from('cart_items')
      .insert({
        cart_id: existingcart.id,
        product_id: productid,
        quantity,
        price: (
          parseInt(unitprice.replace(/,/g, '')) * quantity
        ).toLocaleString('en-US'),
        size,
        unitprice,
      })
      .select(`id,product_id(name,slug,image), quantity, price, size`)
      .single();

    console.log('working');
    console.log(cartitemerror);
    if (cartitemerror || !cartitem) {
      return res.status(500).json({ message: 'Error adding item to cart' });
    }

    return res
      .status(200)
      .json({ message: 'Item added to cart successfully', cartitem });
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
  console.log(newcarterror);

  const { data: cartitem, error: cartitemerror } = await supabase
    .from('cart_items')
    .insert({
      cart_id: newcart.id,
      product_id: productid,
      quantity,
      price: (parseInt(unitprice.replace(/,/g, '')) * quantity).toLocaleString(
        'en-US',
      ),
      size,
      unitprice,
    })
    .select(`id,product_id(name,slug,image), quantity, price, size`)
    .single();

  if (cartitemerror || !cartitem) {
    return res.status(500).json({ message: 'Error adding item to cart' });
  }
  console.log(cartitemerror);

  return res
    .status(200)
    .json({ message: 'Item added to new cart successfully', cartitem });
};

export const updatecartquantity = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { cartitemid, quantity } = req.body;

  const { data: existingcartitem, error: existingcartitemerror } =
    await supabase.from('cart_items').select().eq('id', cartitemid).single();

  if (existingcartitemerror || !existingcartitem) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  const { data: cart, error: carterror } = await supabase
    .from('carts')
    .select('user_id')
    .eq('id', existingcartitem.cart_id)
    .single();

  if (carterror || !cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  if (cart.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { data: updatedcartitem, error: updatecartitemerror } = await supabase
    .from('cart_items')
    .update({
      quantity,
      price: (
        parseInt(existingcartitem.unitprice.replace(/,/g, '')) * quantity
      ).toLocaleString('en-US'),
    })
    .eq('id', cartitemid)
    .select('id,quantity, price')
    .single();
  if (updatecartitemerror || !updatedcartitem) {
    return res.status(500).json({
      message: 'Error updating cart item quantity',
    });
  }

  return res.status(200).json({
    message: 'quantity updated successfully',
    updatedcartitem,
  });
};

export const deletecartitem = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const cartitemid = req.body.cartitemid;
  const { data: existingcartitem, error: existingcartitemerror } =
    await supabase.from('cart_items').select().eq('id', cartitemid).single();

  if (existingcartitemerror || !existingcartitem) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  const { data: cart, error: carterror } = await supabase
    .from('carts')
    .select()
    .eq('user_id', req.user.id)
    .single();

  if (carterror || !cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  if (cart.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { data: deletedcartitem, error: deletedcartitemerror } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartitemid)
    .eq('cart_id', existingcartitem.cart_id)
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
  return res.status(200).json({
    message: 'Cart items retrieved successfully',
    cartitems,
    firstname: existingcart.user_id.firstname,
  });
};
