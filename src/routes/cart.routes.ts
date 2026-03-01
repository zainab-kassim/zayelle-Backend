import passport from "../auth/passport";
import { addtocart } from "../controllers/cart.controller";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.post('/addtocart', passport.authenticate('jwt', { session: false }), handleAsyncErr(addtocart));

export default router;
