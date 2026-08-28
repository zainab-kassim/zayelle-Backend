import { z } from 'zod';

export const userGoogleSchema = z.object({
  accessToken: z.string().min(1),
});
