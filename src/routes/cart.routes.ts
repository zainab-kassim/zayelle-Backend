import {
  addtocart,
  updatecartquantity,
  deletecartitem,
  getcart,
} from '../controllers/cart.controller';
import { isLoggedIn } from '../middleware/isLoggedIn';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import { validateUser } from '../middleware/validate';
import { addToCartSchema } from '../schemas/create.cart.schema';
import { deteleCartItemSchema } from '../schemas/delete.cartitem.schema';
import { updateQuantitySchema } from '../schemas/updatequantity.cartitem.schema';
import { cartLimiter } from '../middleware/consume';

const router = Router();
router.get('/', isLoggedIn, handleAsyncErr(getcart));
router.post(
  '/addtocart',
  isLoggedIn,
  cartLimiter,
  validateUser(addToCartSchema),
  handleAsyncErr(addtocart),
);
router.delete(
  '/deletecartitem',
  isLoggedIn,
  cartLimiter,
  validateUser(deteleCartItemSchema),
  handleAsyncErr(deletecartitem),
);
router.put(
  '/updatequantity',
  isLoggedIn,
  cartLimiter,
  validateUser(updateQuantitySchema),
  handleAsyncErr(updatecartquantity),
);

export default router;
