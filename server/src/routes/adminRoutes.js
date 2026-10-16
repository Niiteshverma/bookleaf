import { Router } from 'express';
import {
  getAllTickets,
  getAdminDashboardStats,
  getAdminTeam,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all admin endpoints
router.use(authenticate, requireAdmin);

// Ticket queue with filtering by status, category, priority, date and search
router.get('/tickets', getAllTickets);

// Dashboard summary metrics & queue analytics
router.get('/dashboard-stats', getAdminDashboardStats);

// List of operations admins for assignment selector
router.get('/team', getAdminTeam);

export default router;
