import { supabase } from "../config/db"

export const handlePostPayment = async (order_id: number, cart_id: number) => {
    // Fetch cart items
    const { data: cartItems, error: cartItemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart_id)

    if (cartItemsError) throw new Error('Error fetching cart items')

    // Insert into order_items
    const itemsToInsert = cartItems.map(item => ({
        order_id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        unit_price: item.unitprice
    }))

    const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

    if (orderItemsError) throw new Error('Error creating order items')

    // Delete cart items
    const { data: deletedCartItems, error: deletedCartItemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart_id)

    if (deletedCartItemsError) throw new Error('Error clearing cart')
}