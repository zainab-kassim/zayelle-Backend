import express from 'express'
import dotenv from 'dotenv'
import { Request, Response, NextFunction } from 'express';
import userRoutes from './routes/user.routes';
import { corsMiddleware } from './middleware/cors';
import { addProduct } from './addProduct';
import productRoutes from './routes/product.routes';




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


// To parse form data in POST request body
app.use(express.urlencoded({ extended: true }));

// To parse incoming JSON in POST request body
app.use(express.json({ limit: '2mb' }));

// Middleware to use user routes
app.use('/api/auth', userRoutes);

// Middleware to use product routes
app.use('/api/products', productRoutes);

//To handle errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Something went wrong' });
});


// Start the server
const StartServer = async () => {
    try {
        
        console.log('database connected successfully')
        app.listen(PORT, () => {
            console.log(`Zayelle server is running on http://localhost:${PORT}`);
        });
 
    
    } catch (err) {
        console.error('Failed to connect to DB:', err);
        console.error(err)
    }
}

StartServer()