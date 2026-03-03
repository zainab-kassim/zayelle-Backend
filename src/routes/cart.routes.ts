import passport from "../auth/passport";
import { addtocart,updatecartquantity,deletecartitem, getcart} from "../controllers/cart.controller";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.get('/', passport.authenticate('jwt', { session: false }), handleAsyncErr(getcart));
router.post('/addtocart', passport.authenticate('jwt', { session: false }), handleAsyncErr(addtocart));
router.delete('/deletecartitem', passport.authenticate('jwt', { session: false }), handleAsyncErr(deletecartitem));
router.put('/updatequantity', passport.authenticate('jwt', { session: false }), handleAsyncErr(updatecartquantity));

export default router;
