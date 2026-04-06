import { stripeWebhook } from '../controllers/webhooks/stripe';
import express, { Router } from 'express';
import { handleAsyncErr } from '../utils/handleAsyncErr';
import { paystackWebhook } from '../controllers/webhooks/paystack';

const router = Router();

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleAsyncErr(stripeWebhook),
);

router.post('/paystack', handleAsyncErr(paystackWebhook));

export default router;
