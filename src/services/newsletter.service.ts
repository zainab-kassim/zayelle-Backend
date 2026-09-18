import { supabaseAdmin } from '../config/supabaseAdmin';
import logger from '../middleware/logger';

export type SubscribeResult =
  | { status: 'subscribed' }
  | { status: 'already_subscribed' }
  | { status: 'error' };

// Postgres unique_violation — already subscribed, not an error
const UNIQUE_VIOLATION = '23505';

export async function subscribeToNewsletter(
  email: string,
): Promise<SubscribeResult> {
  // check first — no unique constraint on email in the live table
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('newsletters')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    logger.error({ lookupError }, 'Error checking newsletter subscriber');
    return { status: 'error' };
  }

  if (existing) {
    return { status: 'already_subscribed' };
  }

  const { error: insertError } = await supabaseAdmin
    .from('newsletters')
    .insert({ email });

  if (insertError) {
    // also handles a race with the check above, or a constraint added later
    if (insertError.code === UNIQUE_VIOLATION) {
      return { status: 'already_subscribed' };
    }
    logger.error({ insertError }, 'Error saving newsletter subscriber');
    return { status: 'error' };
  }

  return { status: 'subscribed' };
}
