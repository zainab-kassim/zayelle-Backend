import z from 'zod';

export const stripePaymentSchema = z.object({
  local_amount: z.string(),
  currency: z.string(),
  order_id: z.number().positive(),
});
