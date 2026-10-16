import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for login (30 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public login route for both Authors and Admins with brute-force protection
router.post('/login', loginLimiter, login);

// Protected route to get the logged-in user's profile
router.get('/me', authenticate, getMe);

export default router;
