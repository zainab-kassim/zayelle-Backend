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

const PORT = 4000;

// Load environment variables if not in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Initialize Express application
const app = express();

// Use the CORS middleware
app.use(corsMiddleware);

app.options('/', corsMiddleware);

app.use(cookieParser());

// To parse form data in POST request body
app.use(express.urlencoded({ extended: true }));

// ✅ Webhooks FIRST (raw body needed)
app.use('/api/webhooks', webhookRoute);

// To parse incoming JSON in POST request body
app.use(express.json({ limit: '2mb' }));

app.use(currencyMiddleware);

// Middleware to use user routes
app.use('/api/auth', userRoutes);

// Middleware to use product routes
app.use('/api/products', productRoutes);

//middleware to use cart routes
app.use('/api/cart', cartRoutes);

//middleware to use order routes
app.use('/api/order', orderRoutes);

//middleware to use payment routes
app.use('/api/payment/paystack', paystackPaymentRoutes);

//middleware for stripe payment routes
app.use('/api/payment/stripe', stripePaymentRoutes);

//To handle errors
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
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
    console.error('Failed to connect to DB:', err);
    console.error(err);
  }
};

export default app;

StartServer();
