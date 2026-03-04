import { stat } from "node:fs";
import { supabase } from "../config/db";
import { Request, Response } from "express";

export const createorder = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }
    console.log(req.user.id)
    const user_id = req.user.id;
    const cart_id = req.body.cart_id;
    const total_price = req.body.total_price;
    const street_address = req.body.street_address;
    const apt_no = req.body.apt_no;
    const phone_number = req.body.phone_number;
    const city = req.body.city;
    const state = req.body.state;
    const postal_code = req.body.postal_code;
    const country = req.body.country;

    const { data: existingcart, error: existingcarterror } = await supabase.from('carts').select(``).eq('id', cart_id).single();
    if (existingcarterror || !existingcart) {
        return res.status(404).json({ message: "Cart not found", existingcarterror })
    }

    const { data: neworder, error: newordererror } = await supabase.from('order').insert({
        user_id,
        cart_id,
        total_price,
        status: ['pending'],
        phone_number,
        street_address,
        apt_no,
        city,
        state,
        postal_code,
        country
    }).select().single();
    if (newordererror || !neworder) {
        return res.status(500).json({ message: "Error creating order", newordererror })
    }

    return res.status(200).json({ message: "Order created successfully", order: neworder })

}


export const getorderhistory = async (req: any, res: any) => {
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }
    const user_id = req.user.id;

    const { data: orders, error } = await supabase.from('order').select(`*,cart_id(*,cart_items(*, product_id(name,slug,image,description)))`).eq('user_id', user_id);

    if (error) {
        return res.status(500).json({ message: "Error fetching order history", error })
    }

    return res.status(200).json({ orders })
}