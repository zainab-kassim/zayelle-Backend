import { SecretKey } from './config';
import passport from 'passport';
import { Request } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { supabase } from '../config/db';

// Function to extract token from cookies
const extractJwtFromCookies = (req: Request) => {
  return req.cookies.accessToken;
};

const opts = {
  jwtFromRequest: extractJwtFromCookies,
  secretOrKey: SecretKey!,
};

export default passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email,firstname,lastname,phonenumber')
        .eq('id', jwt_payload.id)
        .single();

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      console.log(error);
      return done(error, false);
    }
  }),
);
