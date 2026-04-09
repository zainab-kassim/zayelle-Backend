import {
  initializePayment,
  verifyPayment,
} from '../controllers/paystack.payment.controller';
import { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { paystackPaymentSchema } from '../schemas/paystack.payment.schema';
import { validateUser } from '../middleware/validate';
import { paymentLimiter } from '../middleware/consume';

const router = Router();

router.post(
  '/initialize',
  isLoggedIn,
  paymentLimiter,
  validateUser(paystackPaymentSchema),
  handleAsyncErr(initializePayment),
);
router.get(
  '/verify/:reference',
  isLoggedIn,
  paymentLimiter,
  handleAsyncErr(verifyPayment),
);

export default router;
