import {
  createorder,
  getorderhistory,
  getOrder,
  updateshippinginfo,
} from '../controllers/order.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { Router } from 'express';
import { validateUser } from '../middleware/validate';
import { createOrderSchema } from '../schemas/create.order.schema';
import { updateShippingInfoSchema } from '../schemas/shippingInfo.schema';
import { paymentLimiter } from '../middleware/consume';

const router = Router();
router.post(
  '/',
  isLoggedIn,
  paymentLimiter,
  validateUser(createOrderSchema),
  handleAsyncErr(createorder),
);
router.get('/orderhistory', isLoggedIn, handleAsyncErr(getorderhistory));
router.post(
  '/edit-shipping-info',
  isLoggedIn,
  paymentLimiter,
  validateUser(updateShippingInfoSchema),
  handleAsyncErr(updateshippinginfo),
);
// must stay after /orderhistory and /edit-shipping-info so those literal
// paths aren't swallowed by this param route
router.get('/:order_id', isLoggedIn, handleAsyncErr(getOrder));
export default router;
