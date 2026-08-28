import { z } from 'zod';

export const userGoogleSchema = z.object({
  idToken: z.string().min(1),
});
