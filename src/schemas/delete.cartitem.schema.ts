import z from 'zod';

export const deteleCartItemSchema = z.object({
  cartitemid: z.number().positive(),
});
