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
  // Explicit check first — the live table has no unique constraint on
  // email, so a bare insert would happily create duplicates instead of
  // erroring with 23505.
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
    // Still handled in case a unique constraint gets added later and two
    // requests race between the check above and this insert.
    if (insertError.code === UNIQUE_VIOLATION) {
      return { status: 'already_subscribed' };
    }
    logger.error({ insertError }, 'Error saving newsletter subscriber');
    return { status: 'error' };
  }

  return { status: 'subscribed' };
}
