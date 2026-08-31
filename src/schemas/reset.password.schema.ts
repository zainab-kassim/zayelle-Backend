import { z } from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12), // matches signup/login rules
});
