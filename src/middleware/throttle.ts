import slowDown from 'express-slow-down';

const throttle = slowDown({
  windowMs: 60 * 1000, // 1 minute window
  delayAfter: 50, // start slowing after 50 requests
  delayMs: (hits) => hits * 100, // add 100ms per extra request
});

const strictThrottle = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 20, // stricter — only 20 before slowing
  delayMs: (hits) => hits * 200,
});

export { throttle, strictThrottle };
