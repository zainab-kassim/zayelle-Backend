import { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { validateUser } from '../middleware/validate';
import { strictThrottle } from '../middleware/throttle';
import {
  cancelCheckout,
  createCheckoutSession,
  verifyCheckoutSession,
} from '../controllers/payment/stripe';
import { stripePaymentSchema } from '../schemas/stripe.payment.schema';
import {
  cancelPaystackCheckout,
  initializePayment,
  verifyPayment,
} from '../controllers/payment/paystack';
import { paystackPaymentSchema } from '../schemas/paystack.payment.schema';

const router = Router();

router.use(strictThrottle);

const stripeRouter = Router();
stripeRouter.post(
  '/create-checkout-session',
  isLoggedIn,
  validateUser(stripePaymentSchema),
  handleAsyncErr(createCheckoutSession),
);
stripeRouter.post(
  '/cancel-checkout',
  isLoggedIn,
  validateUser(stripePaymentSchema),
  handleAsyncErr(cancelCheckout),
);
stripeRouter.get(
  '/verify-payment/:session_id',
  isLoggedIn,
  handleAsyncErr(verifyCheckoutSession),
);

const paystackRouter = Router();
paystackRouter.post(
  '/initialize',
  isLoggedIn,
  validateUser(paystackPaymentSchema),
  handleAsyncErr(initializePayment),
);
paystackRouter.post(
  '/cancel-checkout',
  isLoggedIn,
  validateUser(paystackPaymentSchema),
  handleAsyncErr(cancelPaystackCheckout),
);
paystackRouter.get(
  '/verify/:reference',
  isLoggedIn,
  handleAsyncErr(verifyPayment),
);

router.use('/stripe', stripeRouter);
router.use('/paystack', paystackRouter);

export default router;
