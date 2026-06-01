import { Router } from 'express';
import { GetCurrency } from '../controllers/currency.controller';
import { handleAsyncErr } from '../utils/handleAsyncErr';

const router = Router();
router.get('/', handleAsyncErr(GetCurrency));

export default router;
