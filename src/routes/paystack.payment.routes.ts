import {
  initializePayment,
  verifyPayment,
} from '../controllers/paystack.payment.controller';
import { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';

const router = Router();

router.post('/initialize', isLoggedIn, handleAsyncErr(initializePayment));
router.get('/verify/:reference', isLoggedIn, handleAsyncErr(verifyPayment));

export default router;
