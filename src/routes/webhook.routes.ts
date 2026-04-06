import { stripeWebhook } from '../controllers/webhooks/stripe';
import express, { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { isLoggedIn } from '../middleware/isLoggedIn';

const router = Router();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  isLoggedIn,
  handleAsyncErr(stripeWebhook),
);

export default router;
