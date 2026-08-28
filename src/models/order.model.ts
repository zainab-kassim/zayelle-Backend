export interface orders {
  id: number;
  user_id: number;
  cart_id: number;
  totalAmount: string;
  status: [string];
  customerName: string;
  customerPhonenumber: string;
  street_address: string;
  apt_no: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  createdAt?: Date;
}
