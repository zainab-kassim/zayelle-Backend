import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // this reads your .env

if (!process.env.PROJECTURL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase env variables missing');
}

export const supabaseAdmin = createClient(
  process.env.PROJECTURL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role key
);
