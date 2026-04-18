import { supabase } from '../config/db';
import logger from '../middleware/logger';

export const deleteStaleRecords = async () => {
  const { data: staleOrders, error: fetchError } = await supabase
    .from('order')
    .select('*')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .in('status', ['abandoned', 'failed']);

  if (fetchError) {
    logger.error({ error: fetchError }, 'Error fetching stale records');
  }

  logger.info(
    `Deleting ${JSON.stringify(staleOrders).length} stale orders: ${JSON.stringify(staleOrders)}`,
  );

  const { data: _deletedStaleOrders, error: deleteError } = await supabase
    .from('order')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .in('status', ['abandoned', 'failed']);

  if (deleteError) {
    logger.error({ error: deleteError }, 'Error deleting stale records');
  }

  logger.info(
    `Deleted ${JSON.stringify(_deletedStaleOrders).length} stale orders: ${JSON.stringify(_deletedStaleOrders)}`,
  );
};
