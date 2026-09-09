import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'Production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'Production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export default logger;
