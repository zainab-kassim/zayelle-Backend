import { z } from 'zod';

export const userSignupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(10).max(15),
  password: z.string().min(6),
});
