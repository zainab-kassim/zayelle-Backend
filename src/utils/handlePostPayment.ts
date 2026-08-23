import { supabase } from '../config/db';
import logger from '../middleware/logger';

export const handlePostPayment = async (
  order_id: number,
  cart_id: number,
  // false for failed/canceled/abandoned orders — still record what was
  // ordered in order_items, but leave the cart alone so the user can retry
  { clearCart = true }: { clearCart?: boolean } = {},
) => {
  // Fetch cart items
  const { data: cartItems, error: cartItemsError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart_id);

  if (cartItemsError) {
    logger.error({ cartItemsError }, 'Error fetching carts');
    throw new Error('Error fetching cart items');
  }

  // Insert into order_items
  const itemsToInsert = cartItems.map((item) => ({
    order_id,
    cart_id: item.cart_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    size: item.size,
    unit_price: item.unitprice,
  }));

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .upsert(itemsToInsert, {
      onConflict: 'order_id,product_id', // needs a unique constraint on these two columns
      ignoreDuplicates: true,
    });

  if (orderItemsError) {
    logger.error({ orderItemsError }, 'Error creating order items');
    throw new Error('Error creating Order items');
  }

  if (!clearCart) return;

  // Delete cart items
  const { error: deletedCartItemsError } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart_id);

  if (deletedCartItemsError) {
    logger.error({ deletedCartItemsError }, 'error clearing cart');
  }
};
