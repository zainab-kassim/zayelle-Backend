import { addtocart,updatecartquantity,deletecartitem, getcart} from "../controllers/cart.controller";
import { isLoggedIn } from "../middleware/isLoggedIn";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.get('/', isLoggedIn, handleAsyncErr(getcart));
router.post('/addtocart', isLoggedIn, handleAsyncErr(addtocart));
router.delete('/deletecartitem', isLoggedIn, handleAsyncErr(deletecartitem));
router.put('/updatequantity', isLoggedIn, handleAsyncErr(updatecartquantity));

export default router;
