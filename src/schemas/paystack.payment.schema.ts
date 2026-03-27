import z from 'zod';

export const paystackPaymentSchema = z.object({
  order_id: z.number().positive(),
});
