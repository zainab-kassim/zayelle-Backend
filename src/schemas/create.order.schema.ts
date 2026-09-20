import z from 'zod';

// must match the country dropdown in the frontend's AddressForm — a typo'd
// or unsupported country would otherwise silently ship for free
export const SHIPPING_COUNTRIES = [
  'Canada',
  'United States',
  'United Kingdom',
  'Nigeria',
] as const;

export const createOrderSchema = z.object({
  cart_id: z.number().positive(),
  street_address: z.string(),
  apt_no: z.string().optional(),
  customerName: z.string(),
  customerPhonenumber: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.enum(SHIPPING_COUNTRIES),
});
