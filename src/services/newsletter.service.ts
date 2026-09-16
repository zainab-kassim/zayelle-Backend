import { supabaseAdmin } from '../config/supabaseAdmin';
import logger from '../middleware/logger';

export type SubscribeResult =
  | { status: 'subscribed' }
  | { status: 'already_subscribed' }
  | { status: 'error' };

// Postgres unique_violation — the email is already in the table, which
// isn't a failure case here, just a no-op re-subscribe.
const UNIQUE_VIOLATION = '23505';

export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  const { error } = await supabaseAdmin.from('newsletters').insert({ email });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { status: 'already_subscribed' };
    }
    logger.error({ error }, 'Error saving newsletter subscriber');
    return { status: 'error' };
  }

  return { status: 'subscribed' };
}
