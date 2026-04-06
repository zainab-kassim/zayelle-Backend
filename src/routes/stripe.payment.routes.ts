import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import {
  createPaymentIntent,
  verifyStripePayment,
} from '../controllers/stripe.payment.controller';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { stripePaymentSchema } from '../schemas/stripe.payment.schema';
import { validateUser } from '../middleware/validate';

const router = Router();

router.post(
  '/create-payment-intent',
  isLoggedIn,
  validateUser(stripePaymentSchema),
  handleAsyncErr(createPaymentIntent),
);
router.get(
  '/verify-payment/:paymentIntent_id',
  isLoggedIn,
  handleAsyncErr(verifyStripePayment),
);

export default router;
