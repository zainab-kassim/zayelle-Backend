import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Fail fast at boot, same convention as config/supabaseAdmin.ts
if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
  throw new Error('Resend env variables missing');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_FROM = process.env.EMAIL_FROM;
