import z from 'zod';

export const updateShippingInfoSchema = z.object({
  order_id: z.number().positive(),
  street_address: z.string().optional(),
  apt_no: z.string().optional(),
  phone_number: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});
