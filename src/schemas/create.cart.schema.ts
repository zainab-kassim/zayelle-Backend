import z from 'zod';

export const addToCartSchema = z.object({
  productid: z.number().positive(),
  quantity: z.number().min(1),
  size: z.string(),
});
