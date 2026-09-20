import z from 'zod';
import { SHIPPING_COUNTRIES } from './create.order.schema';

export const updateShippingInfoSchema = z.object({
  order_id: z.number().positive(),
  street_address: z.string().optional(),
  apt_no: z.string().optional(),
  customerName: z.string().optional(),
  customerPhonenumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.enum(SHIPPING_COUNTRIES).optional(),
});
