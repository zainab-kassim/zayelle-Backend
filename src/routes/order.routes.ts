import {
  createorder,
  getorderhistory,
  updateshippinginfo,
} from '../controllers/order.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { Router } from 'express';

const router = Router();
router.post('/', isLoggedIn, handleAsyncErr(createorder));
router.get('/orderhistory', isLoggedIn, handleAsyncErr(getorderhistory));
router.post(
  '/edit-shipping-info',
  isLoggedIn,
  handleAsyncErr(updateshippinginfo),
);
export default router;
