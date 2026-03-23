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

const router = Router();
router.get('/', isLoggedIn, handleAsyncErr(getcart));
router.post(
  '/addtocart',
  isLoggedIn,
  validateUser(addToCartSchema),
  handleAsyncErr(addtocart),
);
router.delete(
  '/deletecartitem',
  isLoggedIn,
  validateUser(deteleCartItemSchema),
  handleAsyncErr(deletecartitem),
);
router.put(
  '/updatequantity',
  isLoggedIn,
  validateUser(updateQuantitySchema),
  handleAsyncErr(updatecartquantity),
);

export default router;
