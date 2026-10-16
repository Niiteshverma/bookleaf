import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');



// Route imports
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Error handling middlewares
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible integration in decoupled client/server environments
    crossOriginEmbedderPolicy: false,
  })
);

// Rate Limiting Guards
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Limit each IP to 200 general API requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'production') {
        callback(null, true); // Allow configured clients in production
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
  })
);

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'BookLeaf Author Support & Communication API',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
  });
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/author', authorRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// Catch 404 for undefined routes
app.use(notFoundHandler);

// Global centralized error handler
app.use(globalErrorHandler);

export default app;
