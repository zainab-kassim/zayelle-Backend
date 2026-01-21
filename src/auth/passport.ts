import { SecretKey } from "./config";
import User from "../models/user.model";
import passport from "passport";
import { Request } from "express";
import { Strategy as JwtStrategy } from "passport-jwt";


// Function to extract token from cookies
const extractJwtFromCookies = (req: Request) => {
    return req.cookies.accessToken
};

var opts = {
    jwtFromRequest: extractJwtFromCookies,
    secretOrKey: SecretKey!
}


export default passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findOne({ where: { id: jwt_payload.id } })

        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        console.log(error)
        return done(error, false)
    }
}));