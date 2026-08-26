import express from 'express';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import userRoutes from './routes/user.routes';
import { corsMiddleware } from './middleware/cors';
import cookieParser from 'cookie-parser';
import cartRoutes from './routes/cart.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import paystackPaymentRoutes from './routes/paystack.payment.routes';
import stripePaymentRoutes from './routes/stripe.payment.routes';
import { currencyMiddleware } from './middleware/currencyMiddleware';
import webhookRoute from './routes/webhook.routes';
import { generalLimiter } from './middleware/consume';
import { throttle, strictThrottle } from './middleware/throttle';
import helmet from 'helmet';
import logger from './middleware/logger';
import { cleanupJob } from './jobs/cleanup';
import currencyRoutes from './routes/currency.routes';
import bookingRouter from './routes/bookmeeting.routes';
const PORT = 4000;

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Initialize Express application
const app = express();

// Trust the first proxy (if behind a proxy like Nginx or Heroku)
app.set('trust proxy', 1);

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Use the CORS middleware
app.use(corsMiddleware);

app.options('/', corsMiddleware);

app.use(cookieParser());

app.use(helmet());

// ✅ Webhooks FIRST (raw body needed)
app.use('/api/webhooks', webhookRoute);

// To parse form data in POST request body
app.use(express.urlencoded({ extended: true }));

// To parse incoming JSON in POST request body
app.use(express.json({ limit: '2mb' }));

app.use(currencyMiddleware);

// Start the cleanup job to run daily at midnight
cleanupJob.start();

// Middleware to use currency routes
app.use('/api/currency', currencyRoutes);

// Middleware to use user routes
app.use('/api/auth', throttle, userRoutes);

//middleware to use cart routes
app.use('/api/cart', throttle, cartRoutes);

//middleware to use payment routes
app.use('/api/payment/paystack', strictThrottle, paystackPaymentRoutes);

//middleware for stripe payment routes
app.use('/api/payment/stripe', strictThrottle, stripePaymentRoutes);

app.use(generalLimiter);

// Middleware to use product routes
app.use('/api/products', throttle, productRoutes);

//middleware to use order routes
app.use('/api/order', throttle, orderRoutes);

// Middleware to use booking routes
app.use('/api/booking', bookingRouter);

//To handle errors
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, method: req.method, url: req.url }, err.message);
  res.status(500).json({ message: 'Something went wrong' });
});

// Start the server
const StartServer = async () => {
  try {
    console.log('database connected successfully');
    app.listen(PORT, () => {
      console.log(`Zayelle server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to connect to DB');
  }
};

export default app;

StartServer();
