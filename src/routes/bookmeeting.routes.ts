import { Router } from 'express';
import { BookMeeting } from '../controllers/bookmeeting.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';

const router = Router();
router.post('/', handleAsyncErr(BookMeeting));

export default router;
