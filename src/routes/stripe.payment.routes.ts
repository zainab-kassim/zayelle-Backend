import { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import {
  createPaymentIntent,
  verifyStripePayment,
} from '../controllers/stripe.payment.controller';
import { isLoggedIn } from '../middleware/isLoggedIn';

const router = Router();

router.post(
  '/create-payment-intent',
  isLoggedIn,
  handleAsyncErr(createPaymentIntent),
);
router.get(
  '/verify-payment/:paymentIntent_id',
  isLoggedIn,
  handleAsyncErr(verifyStripePayment),
);

export default router;
