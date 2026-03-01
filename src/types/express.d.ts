// src/types/express.d.ts
import { users } from "../models/user.model";

declare global {
    namespace Express {
        interface User extends users {}
    }
}