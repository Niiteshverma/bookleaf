import { Router } from 'express';
import {
  getMyBooks,
  getAuthorDashboardStats,
  getAuthorBooksDropdown,
} from '../controllers/authorController.js';
import { authenticate, requireAuthor } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all author routes with authentication and AUTHOR role check
router.use(authenticate, requireAuthor);

// Author personal published and in-production books
router.get('/books', getMyBooks);

// Author dashboard overview statistics and royalty aggregation
router.get('/dashboard', getAuthorDashboardStats);

// Lightweight books dropdown list for ticket creation modal/form
router.get('/books-dropdown', getAuthorBooksDropdown);

export default router;
