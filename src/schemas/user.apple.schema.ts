import { z } from 'zod';

export const userAppleSchema = z.object({
  idToken: z.string().min(1),
  // Apple only sends the user's name on the very first sign-in, in the JS
  // response (not the token), so the frontend forwards it when present
  fullName: z.string().optional(),
});
