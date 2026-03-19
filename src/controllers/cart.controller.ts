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
        existingcartitemserror,
      });
    }

    if (existingcartitems) {
      const updatedQuantity =
        parseInt(existingcartitems.quantity) + parseInt(quantity);
      const updatedPrice = (
        parseInt(unitprice.replace(/,/g, '')) * updatedQuantity
      ).toLocaleString('en-US');
      const { data: updatedCartItem, error: updateCartItemError } =
        await supabase
          .from('cart_items')
          .update({ quantity: updatedQuantity, price: updatedPrice })
          .eq('id', existingcartitems.id)
          .select()
          .single();
      if (updateCartItemError || !updatedCartItem) {
        return res.status(500).json({
          message: 'Error updating cart item quantity',
          updateCartItemError,
        });
      }
      console.log('Cart item quantity updated:', updatedCartItem);
      return res.status(200).json({
        message: 'Cart item quantity updated successfully',
        cartItem: updatedCartItem,
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
      .select()
      .single();
    if (cartitemerror || !cartitem) {
      return res
        .status(500)
        .json({ message: 'Error adding item to cart', cartitemerror });
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
    .select()
    .single();
  if (newcarterror || !newcart) {
    return res
      .status(500)
      .json({ message: 'Error creating new cart', newcarterror });
  }

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
    .select()
    .single();
  if (cartitemerror || !cartitem) {
    return res
      .status(500)
      .json({ message: 'Error adding item to cart', cartitemerror });
  }

  return res
    .status(200)
    .json({ message: 'Item added to new cart successfully', cartitem });
};

export const updatecartquantity = async (req: Request, res: Response) => {
  const cartitemid = req.body.cartitemid;
  const quantity = req.body.quantity;

  const { data: existingcartitem, error: existingcartitemerror } =
    await supabase.from('cart_items').select().eq('id', cartitemid).single();
  if (existingcartitemerror || !existingcartitem) {
    return res
      .status(404)
      .json({ message: 'Cart item not found', existingcartitemerror });
  }
  const updatedQuantity =
    parseInt(existingcartitem.quantity) + parseInt(quantity);
  if (updatedQuantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1' });
  }

  const { data: updatedcartitem, error: updatecartitemerror } = await supabase
    .from('cart_items')
    .update({
      quantity: updatedQuantity,
      price: (
        parseInt(existingcartitem.unitprice.replace(/,/g, '')) * updatedQuantity
      ).toLocaleString('en-US'),
    })
    .eq('id', cartitemid)
    .select()
    .single();
  if (updatecartitemerror || !updatedcartitem) {
    return res.status(500).json({
      message: 'Error updating cart item quantity',
      updatecartitemerror,
    });
  }
  console.log('Cart item quantity updated successfully:', updatedcartitem);
  return res.status(200).json({
    message: 'quantity updated successfully',
    cartitem: updatedcartitem,
  });
};

export const deletecartitem = async (req: Request, res: Response) => {
  const cartitemid = req.body.cartitemid;
  const { data: existingcartitem, error: existingcartitemerror } =
    await supabase.from('cart_items').select().eq('id', cartitemid).single();
  if (existingcartitemerror || !existingcartitem) {
    return res
      .status(404)
      .json({ message: 'Cart item not found', existingcartitemerror });
  }

  const { data: deletedcartitem, error: deletedcrtitemerror } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartitemid)
    .select()
    .single();
  if (deletedcrtitemerror || !deletedcartitem) {
    return res
      .status(500)
      .json({ message: 'Error deleting cart item', deletedcrtitemerror });
  }
  console.log('Cart item deleted successfully:', deletedcartitem);
  return res.status(200).json({
    message: 'Cart item deleted successfully',
    cartitem: deletedcartitem,
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
    return res
      .status(404)
      .json({ message: 'Cart not found', existingcarterror });
  }
  const { data: cartitems, error: cartitemserror } = await supabase
    .from('cart_items')
    .select(`*,product_id(name,slug,image,description)`)
    .eq('cart_id', existingcart.id);
  if (cartitemserror) {
    return res
      .status(500)
      .json({ message: 'Error retrieving cart items', cartitemserror });
  }
  return res.status(200).json({
    message: 'Cart items retrieved successfully',
    cartitems,
    firstname: existingcart.user_id.firstname,
  });
};
