export interface orders {
    id: number;
    userId: number;
    cart_id: number;
    totalAmount: string;
    status: [string];
    phonenumber: string;
    street_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    createdAt?: Date;
}