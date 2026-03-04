import passport from "../auth/passport";
import { createorder,getorderhistory } from "../controllers/order.controller";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.post('/',passport.authenticate('jwt', { session: false }), handleAsyncErr(createorder));
router.get('/orderhistory', passport.authenticate('jwt', { session: false }), handleAsyncErr(getorderhistory));
export default router;