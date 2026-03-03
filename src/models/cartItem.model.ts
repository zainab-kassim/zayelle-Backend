export interface cartItem{
    id: number;
    cart_id: number;
    product_id: number;
    quantity: number;
    price: string;
    createdAt?: Date;
}