import prisma from '../config/prisma.js';
import { analyzeTicketAndGenerateDraft, generateThreadReply } from '../services/aiService.js';
import { emitToTicket, emitToAdmins, emitToAuthor } from '../socket/socketHandler.js';


/**
 * Generate readable incremental ticket numbers based on highest existing ticket number
 */
async function generateNextTicketNumber() {
  const latestTicket = await prisma.ticket.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { ticketNumber: true },
  });

  if (!latestTicket || !latestTicket.ticketNumber || !latestTicket.ticketNumber.startsWith('BL-')) {
    const count = await prisma.ticket.count();
    return `BL-${1001 + count}`;
  }

  const currentNum = parseInt(latestTicket.ticketNumber.replace('BL-', ''), 10);
  const nextNum = isNaN(currentNum) ? 1001 : currentNum + 1;
  return `BL-${nextNum}`;
}

/**
 * Create a new support ticket (Author Portal)
 * POST /api/tickets
 */
export async function createTicket(req, res) {
  try {
    const authorId = req.user.id;
    const { subject, description, bookId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a ticket subject line.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed query description.',
      });
    }

    // Verify book belongs to author if bookId is provided (supports UUID or bookCode)
    let book = null;
    if (bookId && bookId !== 'general') {
      book = await prisma.book.findFirst({
        where: {
          OR: [{ id: bookId }, { bookCode: bookId }],
          authorId,
        },
      });

      if (!book) {
        return res.status(400).json({
          success: false,
          message: 'Selected book not found or does not belong to your account.',
        });
      }
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { name: true, email: true },
    });

    const ticketNumber = await generateNextTicketNumber();

    // Call Groq AI service for auto-classification, priority and knowledge draft
    const aiAnalysis = await analyzeTicketAndGenerateDraft({
      subject: subject.trim(),
      description: description.trim(),
      authorName: author ? author.name : 'Author',
      bookTitle: book ? book.title : null,
      bookDetails: book
        ? {
            title: book.title,
            isbn: book.isbn,
            genre: book.genre,
            status: book.status,
            mrp: book.mrp,
            royaltyPending: book.royaltyPending,
          }
        : null,
    });

    // Find an admin user to act as official BookLeaf Support sender
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, role: true },
    });

    // Create Ticket and initial message in a single database transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          authorId,
          bookId: book ? book.id : null,
          subject: subject.trim(),
          description: description.trim(),
          status: 'IN_PROGRESS',
          category: aiAnalysis.category,
          priority: aiAnalysis.priority,
          aiCategory: aiAnalysis.category,
          aiPriority: aiAnalysis.priority,
          aiConfidence: aiAnalysis.confidence,
          aiDraftResponse: aiAnalysis.draftResponse,
        },
        include: {
          book: true,
          author: {
            select: { id: true, name: true, email: true, authorCode: true },
          },
        },
      });

      // Save author initial query into conversation thread
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: authorId,
          message: description.trim(),
        },
      });

      // Instant AI Auto-Reply: Post AI generated response directly into conversation
      if (adminUser && aiAnalysis.draftResponse) {
        await tx.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            senderId: adminUser.id,
            message: aiAnalysis.draftResponse,
            isAiGenerated: true,
          },
        });
      }

      return ticket;
    });

    // Notify connected admins via WebSocket in real-time
    emitToAdmins('ticket:new', {
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      authorName: newTicket.author.name,
      createdAt: newTicket.createdAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Support ticket raised successfully.',
      ticket: newTicket,
    });
  } catch (error) {
    console.error('createTicket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create support ticket. Please try again.',
    });
  }
}

/**
 * Get all tickets for the authenticated author
 * GET /api/tickets/my-tickets
 */
export async function getAuthorTickets(req, res) {
  try {
    const authorId = req.user.id;

    const tickets = await prisma.ticket.findMany({
      where: { authorId },
      include: {
        book: {
          select: { id: true, title: true, isbn: true, status: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Preview of latest response
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error('getAuthorTickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets.',
    });
  }
}

/**
 * Get ticket details with full conversation history
 * GET /api/tickets/:id
 * Security rule: Authors can ONLY view their own tickets; internal notes stripped for authors!
 */
export async function getTicketById(req, res) {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            authorCode: true,
          },
        },
        book: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        internalNotes: {
          include: {
            author: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    // Role-based security check
    if (role === 'AUTHOR' && ticket.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own support tickets.',
      });
    }

    // Strict security rule: Strip internal notes and raw AI drafts if requester is an Author
    if (role === 'AUTHOR') {
      const sanitizedTicket = { ...ticket };
      delete sanitizedTicket.internalNotes;
      delete sanitizedTicket.aiDraftResponse;
      return res.status(200).json({
        success: true,
        ticket: sanitizedTicket,
      });
    }

    // Admin receives full ticket payload including notes & AI drafts
    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('getTicketById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details.',
    });
  }
}

/**
 * Add a response message to a ticket conversation thread
 * POST /api/tickets/:id/messages
 */
export async function addMessage(req, res) {
  try {
    const { id: ticketId } = req.params;
    const { id: senderId, role } = req.user;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { author: true },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    // Authorization check
    if (role === 'AUTHOR' && ticket.authorId !== senderId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    // Create the message
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        message: message.trim(),
        isAiGenerated: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Auto update status: If admin replies to OPEN ticket -> IN_PROGRESS
    let newStatus = ticket.status;
    if (role === 'ADMIN' && ticket.status === 'OPEN') {
      newStatus = 'IN_PROGRESS';
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Real-time broadcast to ticket conversation room
    emitToTicket(ticketId, 'message:new', newMessage);

    // If admin sent message, alert author
    if (role === 'ADMIN') {
      emitToAuthor(ticket.authorId, 'ticket:reply_received', {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        message: newMessage.message,
        status: newStatus,
      });
    }

    // Auto AI Reply: If message is sent by Author, trigger AI Assistant auto-response in real-time
    if (role === 'AUTHOR') {
      setTimeout(async () => {
        try {
          const fullTicket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: {
              book: true,
              author: { select: { name: true } },
              messages: {
                include: { sender: { select: { name: true, role: true } } },
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            select: { id: true, name: true, role: true },
          });

          if (fullTicket && adminUser) {
            const aiReplyText = await generateThreadReply({
              ticket: fullTicket,
              conversationHistory: fullTicket.messages,
              authorMessage: message.trim(),
              authorName: fullTicket.author?.name || 'Author',
            });

            const aiReplyMessage = await prisma.ticketMessage.create({
              data: {
                ticketId,
                senderId: adminUser.id,
                message: aiReplyText,
                isAiGenerated: true,
              },
              include: {
                sender: { select: { id: true, name: true, role: true } },
              },
            });

            // Broadcast real-time message to socket room
            emitToTicket(ticketId, 'message:new', aiReplyMessage);

            // Alert author
            emitToAuthor(ticket.authorId, 'ticket:reply_received', {
              ticketId,
              ticketNumber: ticket.ticketNumber,
              message: aiReplyMessage.message,
              status: ticket.status,
            });
          }
        } catch (err) {
          console.error('Auto AI reply error:', err.message);
        }
      }, 500);
    }

    return res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('addMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post message.',
    });
  }
}

/**
 * Admin: Approve and send AI Draft Response (with optional human edits)
 * POST /api/tickets/:id/approve-ai-draft
 */
export async function approveAiDraft(req, res) {
  try {
    const { id: ticketId } = req.params;
    const adminId = req.user.id;
    const { message, resolved } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Approved message cannot be empty.',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { author: true },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    const targetStatus = resolved ? 'RESOLVED' : 'IN_PROGRESS';

    // Transaction: Save message + Update status + Clear active draft
    const [newMessage, updatedTicket] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: adminId,
          message: message.trim(),
          isAiGenerated: true,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: targetStatus,
          aiDraftResponse: null, // Draft has been approved and dispatched
        },
      }),
    ]);

    // Real-time notification to the ticket room & author
    emitToTicket(ticketId, 'message:new', newMessage);
    emitToTicket(ticketId, 'ticket:status_changed', { status: targetStatus });
    emitToAuthor(ticket.authorId, 'ticket:reply_received', {
      ticketId,
      ticketNumber: ticket.ticketNumber,
      message: newMessage.message,
      status: targetStatus,
    });

    return res.status(200).json({
      success: true,
      message: 'AI draft response approved and dispatched to author.',
      sentMessage: newMessage,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('approveAiDraft error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve AI draft response.',
    });
  }
}

/**
 * Admin: Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 * PATCH /api/tickets/:id/status
 */
export async function updateTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: { author: true },
    });

    // Real-time broadcast
    emitToTicket(id, 'ticket:status_changed', { status });
    emitToAuthor(updatedTicket.authorId, 'ticket:status_changed', {
      ticketId: id,
      ticketNumber: updatedTicket.ticketNumber,
      status,
    });

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('updateTicketStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status.',
    });
  }
}

/**
 * Admin: Override AI Category & Priority
 * PATCH /api/tickets/:id/classification
 */
export async function updateTicketClassification(req, res) {
  try {
    const { id } = req.params;
    const { category, priority } = req.body;

    const dataToUpdate = {};

    const validCategories = [
      'ROYALTY_AND_PAYMENTS',
      'ISBN_AND_METADATA_ISSUES',
      'PRINTING_AND_QUALITY',
      'DISTRIBUTION_AND_AVAILABILITY',
      'BOOK_STATUS_AND_PRODUCTION_UPDATES',
      'GENERAL_INQUIRY',
    ];
    if (category) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category.`,
        });
      }
      dataToUpdate.category = category;
    }

    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (priority) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority.`,
        });
      }
      dataToUpdate.priority = priority;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
    });

    emitToTicket(id, 'ticket:updated', updated);

    return res.status(200).json({
      success: true,
      message: 'Ticket category & priority updated.',
      ticket: updated,
    });
  } catch (error) {
    console.error('updateTicketClassification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket classification.',
    });
  }
}

/**
 * Admin: Assign ticket to self or colleague
 * PATCH /api/tickets/:id/assign
 */
export async function assignTicket(req, res) {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedToId: assignedToId || null },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    emitToTicket(id, 'ticket:updated', updated);

    return res.status(200).json({
      success: true,
      message: 'Ticket assignment updated.',
      ticket: updated,
    });
  } catch (error) {
    console.error('assignTicket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket.',
    });
  }
}

/**
 * Admin: Add private internal note (Hidden from Author)
 * POST /api/tickets/:id/internal-notes
 */
export async function addInternalNote(req, res) {
  try {
    const { id: ticketId } = req.params;
    const authorId = req.user.id;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Internal note cannot be empty.',
      });
    }

    const internalNote = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId,
        note: note.trim(),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Broadcast only to admins
    emitToTicket(ticketId, 'internal_note:new', internalNote);

    return res.status(201).json({
      success: true,
      message: 'Internal note saved.',
      internalNote,
    });
  } catch (error) {
    console.error('addInternalNote error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save internal note.',
    });
  }
}

export default {
  createTicket,
  getAuthorTickets,
  getTicketById,
  addMessage,
  approveAiDraft,
  updateTicketStatus,
  updateTicketClassification,
  assignTicket,
  addInternalNote,
};
