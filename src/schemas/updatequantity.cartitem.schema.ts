import z from 'zod';

export const updateQuantitySchema = z.object({
  cartitemid: z.number().positive(),
  quantity: z.number().min(1),
});
