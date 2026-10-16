import { Router } from 'express';
import {
  createTicket,
  getAuthorTickets,
  getTicketById,
  addMessage,
  approveAiDraft,
  updateTicketStatus,
  updateTicketClassification,
  assignTicket,
  addInternalNote,
} from '../controllers/ticketController.js';
import {
  authenticate,
  requireAuthor,
  requireAdmin,
} from '../middlewares/authMiddleware.js';

const router = Router();

// All ticket endpoints require authentication
router.use(authenticate);

// Author specific ticket endpoints
router.post('/', requireAuthor, createTicket);
router.get('/my-tickets', requireAuthor, getAuthorTickets);

// Shared endpoints (Author can view their own; Admin can view all)
router.get('/:id', getTicketById);
router.post('/:id/messages', addMessage);

// Admin exclusive endpoints
router.post('/:id/approve-ai-draft', requireAdmin, approveAiDraft);
router.patch('/:id/status', requireAdmin, updateTicketStatus);
router.patch('/:id/classification', requireAdmin, updateTicketClassification);
router.patch('/:id/assign', requireAdmin, assignTicket);
router.post('/:id/internal-notes', requireAdmin, addInternalNote);

export default router;
