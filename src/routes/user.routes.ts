import { UserSignup,UserLogin,UserLogout } from "../controllers/user.controller";
import { handleAsyncErr } from "../utils/handleAsyncErr";
import { Router } from "express";

const router = Router();
router.post('/signup',handleAsyncErr(UserSignup));
router.post('/login',handleAsyncErr(UserLogin));
router.post('/logout',handleAsyncErr(UserLogout));

export default router;

