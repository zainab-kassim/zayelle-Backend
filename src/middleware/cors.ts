import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const corsMiddleware = cors({
  origin: [process.env.FRONTEND_URL, process.env.LOCAL_URL].filter(
    Boolean,
  ) as string[], // Allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ['Content-Type', 'Authorization', 'x-currency'], // Allow specific headers
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
});
