import { Router } from 'express';
import { BookMeeting } from '../controllers/bookmeeting.controller';
import { bookMeetingSchema } from '../schemas/bookmeeting.schema';
import { validateUser } from '../middleware/validate';
import { authLimiter } from '../middleware/consume';
import { handleAsyncErr } from '../utils/handleAsyncErr';

const router = Router();
router.post(
  '/',
  authLimiter,
  validateUser(bookMeetingSchema),
  handleAsyncErr(BookMeeting),
);

export default router;
