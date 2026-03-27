import z from 'zod';

export const createOrderSchema = z.object({
  cart_id: z.number().positive(),
  street_address: z.string(),
  apt_no: z.string().optional(),
  phone_number: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
});
