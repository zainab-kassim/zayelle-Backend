import { initializePayment,verifyPayment } from "../controllers/Paystack.payment.controller";
import { Router } from "express";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import passport from "../auth/passport";

const router = Router();    

router.post('/initialize', passport.authenticate('jwt', { session: false }), handleAsyncErr(initializePayment));
router.get('/verify/:reference', passport.authenticate('jwt', { session: false }), handleAsyncErr(verifyPayment));

export default router;