import passport from "../auth/passport";
import { addtocart,updatecartquantity,deletecartitem } from "../controllers/cart.controller";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.post('/addtocart', passport.authenticate('jwt', { session: false }), handleAsyncErr(addtocart));
router.delete('/deletecartitem', passport.authenticate('jwt', { session: false }), handleAsyncErr(deletecartitem));
router.put('/updateitemquantity', passport.authenticate('jwt', { session: false }), handleAsyncErr(updatecartquantity));

export default router;
