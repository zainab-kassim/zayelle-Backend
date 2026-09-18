import { z } from 'zod';

export const bookMeetingSchema = z.object({
  Username: z.string().min(1),
  Date: z.string().min(1),
  Time: z.string().min(1),
  UserEmail: z.string().email(),
});
