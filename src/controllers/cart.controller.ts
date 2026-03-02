import { supabase } from "../config/db";


export const addtocart = async (req: any, res: any) => {
    const userid = req.user.id;
    const productid = req.body.productid;
    const quantity = req.body.quantity;

    const { data: existingcart, error } = await supabase.from('carts').select().eq('user_id', userid).select().single()

    if (existingcart) {
        const { data: existingcartitems, error: existingcartitemserror } = await supabase.from('cart_items').select().eq('cart_id', existingcart.id).eq('product_id', productid).single();
        if (existingcartitemserror && existingcartitemserror.code !== 'PGRST116') {
            return res.status(500).json({ message: "Error checking existing cart items", existingcartitemserror })
        }

        if (existingcartitems) {
            const updatedQuantity = existingcartitems.quantity + 1;
            const { data: updatedCartItem, error: updateCartItemError } = await supabase.from('cart_items').update({ quantity: updatedQuantity }).eq('id', existingcartitems.id).select().single();
            if (updateCartItemError || !updatedCartItem) {
                return res.status(500).json({ message: "Error updating cart item quantity", updateCartItemError })
            }
            console.log("Cart item quantity updated:", updatedCartItem);
            return res.status(200).json({ message: "Cart item quantity updated successfully", cartItem: updatedCartItem })
        }

        const { data: cartitem, error: cartitemerror } = await supabase.from('cart_items').insert({
            cart_id: existingcart.id,
            product_id: productid,
            quantity
        }).select().single();
        if (cartitemerror || !cartitem) {
            return res.status(500).json({ message: "Error adding item to cart", cartitemerror })
        }
        console.log("Item added to existing cart:", cartitem);
        return res.status(200).json({ message: "Item added to cart successfully", cartitem })
    }

    const { data: newcart, error: newcarterror } = await supabase.from('carts').insert({
        user_id: userid
    }).select().single();
    if (newcarterror || !newcart) {
        return res.status(500).json({ message: "Error creating new cart", newcarterror })
    }

    const { data: cartitem, error: cartitemerror } = await supabase.from('cart_items').insert({
        cart_id: newcart.id,
        product_id: productid,
        quantity
    }).select().single();
    if (cartitemerror || !cartitem) {
        return res.status(500).json({ message: "Error adding item to cart", cartitemerror })
    }
    console.log("Item added to new cart:", cartitem);
    return res.status(200).json({ message: "Item added to new cart successfully", cartitem })
}


export const updatecartquantity = async (req: any, res: any) => {
    const cartitemid = req.body.cartitemid;
    const quantity = req.body.quantity;
     
    const {data:existingcartitem, error:existingcartitemerror}=await supabase.from('cart_items').select().eq('id',cartitemid).single();
    if(existingcartitemerror || !existingcartitem){
        return res.status(404).json({message:"Cart item not found",existingcartitemerror})
    }

    const {data:updatedcartitem,error:updatecartitemerror}=await supabase.from('cart_items').update({quantity}).eq('id',cartitemid).select().single();
    if(updatecartitemerror || !updatedcartitem){
        return res.status(500).json({message:"Error updating cart item quantity",updatecartitemerror})
    }
    console.log("Cart item quantity updated successfully:",updatedcartitem);
    return res.status(200).json({message:"quantity updated successfully",cartitem:updatedcartitem})
}


export const deletecartitem=async(req:any,res:any)=>{
    const cartitemid=req.body.cartitemid;
    const {data:existingcartitem,error:existingcartitemerror}=await supabase.from('cart_items').select().eq('id',cartitemid).single();
    if(existingcartitemerror || !existingcartitem){
        return res.status(404).json({message:"Cart item not found",existingcartitemerror})
    }

    const {data:deletedcartitem,error:deletedcrtitemerror}=await supabase.from('cart_items').delete().eq('id',cartitemid).select().single();
    if(deletedcrtitemerror || !deletedcartitem){
        return res.status(500).json({message:"Error deleting cart item",deletedcrtitemerror})
    }
    console.log("Cart item deleted successfully:",deletedcartitem);
    return res.status(200).json({message:"Cart item deleted successfully",cartitem:deletedcartitem})
}