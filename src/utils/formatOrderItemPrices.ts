// converts item prices with the rate stored on the order (locked in at
// checkout), not today's live rate — otherwise these wouldn't match the
// order's own totalLocal. Shared by getOrderHistory and getOrderDetails.
export function formatOrderItemPrices<
  T extends { rate: number; order_items: { price: number }[] },
>(order: T): T {
  return {
    ...order,
    order_items: order.order_items.map((item) => ({
      ...item,
      price: parseFloat((item.price * order.rate).toFixed(2)),
    })),
  };
}
