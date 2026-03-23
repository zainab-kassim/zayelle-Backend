import {
  createorder,
  getorderhistory,
  updateshippinginfo,
} from '../controllers/order.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { Router } from 'express';
import { validateUser } from '../middleware/validate';
import { createOrderSchema } from '../schemas/create.order.schema';
import { updateShippingInfoSchema } from '../schemas/shippingInfo.schema';

const router = Router();
router.post(
  '/',
  isLoggedIn,
  validateUser(createOrderSchema),
  handleAsyncErr(createorder),
);
router.get('/orderhistory', isLoggedIn, handleAsyncErr(getorderhistory));
router.post(
  '/edit-shipping-info',
  isLoggedIn,
  validateUser(updateShippingInfoSchema),
  handleAsyncErr(updateshippinginfo),
);
export default router;
