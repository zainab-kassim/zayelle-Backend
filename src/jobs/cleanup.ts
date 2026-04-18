import cron from 'node-cron';
import { deleteStaleRecords } from '../utils/deleteStaleRecords';

export const cleanupJob = cron.schedule('0 0 * * *', async () => {
  await deleteStaleRecords();
});
