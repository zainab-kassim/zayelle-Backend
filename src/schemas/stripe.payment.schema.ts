import z from 'zod';

export const stripePaymentSchema = z.object({
  order_id: z.number().positive(),
});
