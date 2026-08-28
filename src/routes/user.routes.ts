import {
  UserSignup,
  UserLogin,
  GoogleAuth,
  AppleAuth,
  UserLogout,
  refreshToken,
} from '../controllers/user.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import { userSignupSchema } from '../schemas/user.signup.schema';
import { userLoginSchema } from '../schemas/user.login.schema';
import { userGoogleSchema } from '../schemas/user.google.schema';
import { userAppleSchema } from '../schemas/user.apple.schema';
import { validateUser } from '../middleware/validate';
import { authLimiter } from '../middleware/consume';

const router = Router();
router.post(
  '/signup',
  authLimiter,
  validateUser(userSignupSchema),
  handleAsyncErr(UserSignup),
);
router.post(
  '/login',
  authLimiter,
  validateUser(userLoginSchema),
  handleAsyncErr(UserLogin),
);
router.post(
  '/google',
  authLimiter,
  validateUser(userGoogleSchema),
  handleAsyncErr(GoogleAuth),
);
router.post(
  '/apple',
  authLimiter,
  validateUser(userAppleSchema),
  handleAsyncErr(AppleAuth),
);
router.post('/logout', handleAsyncErr(UserLogout));

//Refresh Token
router.post('/token', handleAsyncErr(refreshToken));

export default router;
