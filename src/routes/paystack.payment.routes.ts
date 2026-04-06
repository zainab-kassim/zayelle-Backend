import {
  initializePayment,
  verifyPayment,
} from '../controllers/paystack.payment.controller';
import { paystackWebhook } from '../controllers/webhooks/paystack';
import { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { paystackPaymentSchema } from '../schemas/paystack.payment.schema';
import { validateUser } from '../middleware/validate';

const router = Router();

router.post(
  '/initialize',
  isLoggedIn,
  validateUser(paystackPaymentSchema),
  handleAsyncErr(initializePayment),
);
router.get('/verify/:reference', isLoggedIn, handleAsyncErr(verifyPayment));
router.post('/webhook/paystack', isLoggedIn, handleAsyncErr(paystackWebhook));

export default router;
