import { RateLimiterMemory } from 'rate-limiter-flexible';

//for general api routes
const limiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
});

//for auth routes
const authlimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

//for cart routes
const cartlimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

//for payment routes
const paymentlimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

export { limiter, authlimiter, cartlimiter, paymentlimiter };
