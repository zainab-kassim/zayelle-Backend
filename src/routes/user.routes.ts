import {
  UserSignup,
  UserLogin,
  UserLogout,
  refreshToken,
} from '../controllers/user.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import { userSignupSchema } from '../schemas/user.signup.schema';
import { userLoginSchema } from '../schemas/user.login.schema';
import { validateUser } from '../middleware/validate';
import { isLoggedIn } from '../middleware/isLoggedIn';

const router = Router();
router.post(
  '/signup',
  validateUser(userSignupSchema),
  handleAsyncErr(UserSignup),
);
router.post('/login', validateUser(userLoginSchema), handleAsyncErr(UserLogin));
router.post('/logout', isLoggedIn, handleAsyncErr(UserLogout));

//Refresh Token
router.post('/token', handleAsyncErr(refreshToken));

export default router;
