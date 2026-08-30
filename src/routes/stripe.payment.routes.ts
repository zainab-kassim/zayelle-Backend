import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import {
  cancelCheckout,
  createCheckoutSession,
  verifyCheckoutSession,
} from '../controllers/stripe.payment.controller';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { stripePaymentSchema } from '../schemas/stripe.payment.schema';
import { validateUser } from '../middleware/validate';
import { paymentLimiter } from '../middleware/consume';

const router = Router();

router.post(
  '/create-checkout-session',
  isLoggedIn,
  paymentLimiter,
  validateUser(stripePaymentSchema),
  handleAsyncErr(createCheckoutSession),
);
router.post(
  '/cancel-checkout',
  isLoggedIn,
  paymentLimiter,
  validateUser(stripePaymentSchema),
  handleAsyncErr(cancelCheckout),
);
router.get(
  '/verify-payment/:session_id',
  isLoggedIn,
  paymentLimiter,
  handleAsyncErr(verifyCheckoutSession),
);

export default router;
