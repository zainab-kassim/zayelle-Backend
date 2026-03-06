import axios from "axios";
import { Request, Response } from "express";
import { supabase } from "../config/db";


export const initializePayment = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }
    const email = req.user.email;
    const order_id = req.body.order_id;
    const total_price = req.body.total_price;
    const converted_price = parseInt(total_price) * 100;
    const reference = `ZAYELLE_${order_id}_${Date.now()}`;

    const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
            email,
            amount: converted_price,
            reference,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        }
    );

    const { data: updated_order, error: updated_order_error } = await supabase
        .from('order')
        .update({ reference })
        .eq('id', order_id)
        .single()

    if (updated_order_error) {
        return res.status(500).json({ message: "Error updating order with reference"})
    }
    console.log("Updated order with reference:", updated_order)

    return res.status(200).json({ 
        message: "Payment initialized successfully", 
        auth_url: response.data.data.authorization_url,
        reference 
    });
   
}


export const verifyPayment = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const { reference } = req.params;

    const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        }
    );

    if (response.data.data.status === 'success') {
        const { data: updatedorderstatus, error: updatedorderstatuserror } = await supabase
            .from('order')
            .update({ status: ['success'] })
            .eq('reference', reference)
            .single();
        if (updatedorderstatuserror) {
            return res.status(500).json({ message: "Error updating order status", updatedorderstatuserror })
        }

        return res.status(200).json({ 
            message: "Payment successful", 
            status: response.data.data.status 
        });
    } else {
        return res.status(401).json({ message: "Payment not successful" });
    }
}