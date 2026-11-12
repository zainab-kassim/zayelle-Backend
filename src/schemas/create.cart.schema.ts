import z from 'zod';

// only required for made-to-measure pieces (Floreal) — enforced per-product
// in the controller, not here, since most products don't need it
export const measurementsSchema = z.object({
  bust: z.number().positive(),
  waist: z.number().positive(),
  hip: z.number().positive(),
});

export const addToCartSchema = z.object({
  productid: z.number().positive(),
  quantity: z.number().min(1),
  size: z.string(),
  measurements: measurementsSchema.optional(),
});
