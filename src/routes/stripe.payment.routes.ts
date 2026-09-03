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

const router = Router();

router.post(
  '/create-checkout-session',
  isLoggedIn,
  validateUser(stripePaymentSchema),
  handleAsyncErr(createCheckoutSession),
);
router.post(
  '/cancel-checkout',
  isLoggedIn,
  validateUser(stripePaymentSchema),
  handleAsyncErr(cancelCheckout),
);
router.get(
  '/verify-payment/:session_id',
  isLoggedIn,
  handleAsyncErr(verifyCheckoutSession),
);

export default router;
