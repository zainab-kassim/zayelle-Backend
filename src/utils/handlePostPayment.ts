import { supabaseAdmin } from '../config/supabaseAdmin';
import logger from '../middleware/logger';
import { sendOrderConfirmationEmail } from './sendOrderConfirmationEmail';

export const handlePostPayment = async (
  order_id: number,
  cart_id: number,
  // false for failed/canceled/abandoned orders — still record what was
  // ordered in order_items, but leave the cart alone so the user can retry
  { clearCart = true }: { clearCart?: boolean } = {},
) => {
  const { data: cartItems, error: cartItemsError } = await supabaseAdmin
    .from('cart_items')
    .select('*, product:product_id(name)')
    .eq('cart_id', cart_id);

  if (cartItemsError) {
    logger.error({ cartItemsError }, 'Error fetching carts');
    throw new Error('Error fetching cart items');
  }

  const itemsToInsert = cartItems.map((item) => ({
    order_id,
    cart_id: item.cart_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    size: item.size,
    unit_price: item.unitprice,
  }));

  const { error: orderItemsError } = await supabaseAdmin
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

  // this only runs on the genuine-success path (clearCart defaults to true
  // there, and every failure/expiry call site passes false), and the caller
  // only reaches handlePostPayment once per order — whichever reconciliation
  // path (webhook or redirect-verify) wins the pending→success flip — so
  // this fires exactly once per order, no separate idempotency check needed
  const { data: order } = await supabaseAdmin
    .from('order')
    .select(
      'id, customerName, totalLocal, currency, rate, street_address, apt_no, city, state, country, postal_code, user_id(email)',
    )
    .eq('id', order_id)
    .single();

  // supabase-js infers this FK join as an array without generated DB types,
  // even though `order.user_id` is always exactly one user
  const customer = Array.isArray(order?.user_id)
    ? order.user_id[0]
    : order?.user_id;

  if (order && customer?.email) {
    // cart_items.price is stored in base currency and converted on read
    // everywhere else (see cart.controller.ts's getcart) — same conversion
    // needed here, or these show up in the wrong amount next to a
    // correctly-converted total
    const emailItems = cartItems.map((item) => ({
      name: item.product?.name ?? 'Item',
      size: item.size,
      quantity: item.quantity,
      price: parseFloat((item.price * order.rate).toFixed(2)),
    }));
    const subtotal = emailItems.reduce((sum, item) => sum + item.price, 0);

    await sendOrderConfirmationEmail(customer.email, {
      orderId: order.id,
      customerName: order.customerName,
      orderCode: `ZKT-87${order.id}`,
      items: emailItems,
      subtotal,
      shipping: Math.max(0, order.totalLocal - subtotal),
      total: order.totalLocal,
      currency: order.currency,
      addressLines: [
        [order.street_address, order.apt_no].filter(Boolean).join(', '),
        [order.city, order.state].filter(Boolean).join(', '),
        order.country,
        order.postal_code,
      ].filter(Boolean),
    });
  }

  const { error: deletedCartItemsError } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('cart_id', cart_id);

  if (deletedCartItemsError) {
    logger.error({ deletedCartItemsError }, 'error clearing cart');
  }
};
