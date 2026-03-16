import { Request, Response, NextFunction } from "express";
import passport from "../auth/passport";

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
 passport.authenticate('jwt', { session: false }, (err:Error,user: Express.User) => {
    if (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
 req.user=user;
 next();
 })(req, res, next)
}