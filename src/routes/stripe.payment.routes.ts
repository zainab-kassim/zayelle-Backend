import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import {
  createPaymentIntent,
  verifyStripePayment,
} from '../controllers/stripe.payment.controller';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { stripePaymentSchema } from '../schemas/stripe.payment.schema';
import { validateUser } from '../middleware/validate';
import { paymentLimiter } from '../middleware/consume';

const router = Router();

router.post(
  '/create-payment-intent',
  isLoggedIn,
  paymentLimiter,
  validateUser(stripePaymentSchema),
  handleAsyncErr(createPaymentIntent),
);
router.get(
  '/verify-payment/:paymentIntent_id',
  isLoggedIn,
  paymentLimiter,
  handleAsyncErr(verifyStripePayment),
);

export default router;
