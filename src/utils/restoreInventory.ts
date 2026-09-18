import { supabaseAdmin } from '../config/supabaseAdmin';
import logger from '../middleware/logger';

// undoes decrement_inventory_on_checkout when a payment doesn't go through —
// called from every failure/cancel/expire path across Stripe and Paystack
export async function restoreInventoryOnFailure(orderId: number) {
  const { error } = await supabaseAdmin.rpc('increment_inventory_on_restore', {
    p_order_id: orderId,
  });
  if (error) {
    logger.error({ error }, 'CRITICAL: inventory restore failed');
  }
}
