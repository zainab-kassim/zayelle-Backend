import cors from 'cors';

export const corsMiddleware = cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
})