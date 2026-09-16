import { Router } from 'express';
import { Subscribe } from '../controllers/newsletter.controller';
import { newsletterSchema } from '../schemas/newsletter.schema';
import { validateUser } from '../middleware/validate';
import { authLimiter } from '../middleware/consume';
import { handleAsyncErr } from '../utils/handleAsyncErr';

const router = Router();

router.post(
  '/subscribe',
  authLimiter,
  validateUser(newsletterSchema),
  handleAsyncErr(Subscribe),
);

export default router;
