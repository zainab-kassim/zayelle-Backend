// src/types/express.d.ts
import { users } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      currency?: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends users {}
  }
}
