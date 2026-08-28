import { z } from 'zod';

export const userGoogleSchema = z.object({
  googleAccessToken: z.string().min(1),
});
