import {
  UserSignup,
  UserLogin,
  GoogleAuth,
  UserLogout,
  refreshToken,
  ForgotPassword,
  ResetPassword,
} from '../controllers/user.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { Router } from 'express';
import { userSignupSchema } from '../schemas/user.signup.schema';
import { userLoginSchema } from '../schemas/user.login.schema';
import { userGoogleSchema } from '../schemas/user.google.schema';
import { forgotPasswordSchema } from '../schemas/forgot.password.schema';
import { resetPasswordSchema } from '../schemas/reset.password.schema';
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
router.post('/logout', handleAsyncErr(UserLogout));

router.post(
  '/forgot-password',
  authLimiter,
  validateUser(forgotPasswordSchema),
  handleAsyncErr(ForgotPassword),
);
router.post(
  '/reset-password',
  authLimiter,
  validateUser(resetPasswordSchema),
  handleAsyncErr(ResetPassword),
);

//Refresh Token
router.post('/token', handleAsyncErr(refreshToken));

export default router;
