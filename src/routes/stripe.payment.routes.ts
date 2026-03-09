import { Router } from "express";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { createPaymentIntent, verifyStripePayment } from "../controllers/stripe.payment.controller";
import passport from "../auth/passport";

const router = Router();

router.post('/create-payment-intent', passport.authenticate('jwt', { session: false }), handleAsyncErr(createPaymentIntent));
router.get('/verify-payment/:paymentIntent_id', passport.authenticate('jwt', { session: false }), handleAsyncErr(verifyStripePayment));

export default router;