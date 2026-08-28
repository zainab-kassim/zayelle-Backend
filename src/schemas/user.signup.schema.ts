import { z } from 'zod';

export const userSignupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(12),
});
