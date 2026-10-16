import prisma from '../config/prisma.js';

/**
 * Get all tickets across all authors with advanced filtering & sorting
 * GET /api/admin/tickets
 * Query params: status, category, priority, search, dateFrom, dateTo, urgentOnly, page, limit
 */
export async function getAllTickets(req, res) {
  try {
    const {
      status,
      category,
      priority,
      search,
      dateFrom,
      dateTo,
      urgentOnly,
      assignedToId,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId === 'unassigned' ? null : assignedToId;
    }

    // Filter urgent / old unresolved tickets
    if (urgentOnly === 'true') {
      where.status = { in: ['OPEN', 'IN_PROGRESS'] };
      where.priority = { in: ['CRITICAL', 'HIGH'] };
    }

    // Whitelist and sanitize sorting parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'category', 'ticketNumber'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeOrder = order && order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Date range filter with validity checks
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) {
        const parsedFrom = new Date(dateFrom);
        if (!isNaN(parsedFrom.getTime())) {
          dateFilter.gte = parsedFrom;
        }
      }
      if (dateTo) {
        const parsedTo = new Date(dateTo);
        if (!isNaN(parsedTo.getTime())) {
          dateFilter.lte = parsedTo;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    // Search query across subject, description, ticketNumber, author name, or book title
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { author: { email: { contains: q, mode: 'insensitive' } } },
        { book: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Calculate urgency flag (unresolved tickets > 48 hours old)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, authorCode: true },
        },
        book: {
          select: { id: true, title: true, isbn: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true, internalNotes: true },
        },
      },
      orderBy: {
        [safeSortBy]: safeOrder,
      },
    });

    // Decorate with isOverdue / isUrgent metadata for admin UI badges
    const enrichedTickets = tickets.map((t) => {
      const isUnresolved = t.status === 'OPEN' || t.status === 'IN_PROGRESS';
      const isOld = t.createdAt < fortyEightHoursAgo;
      const isCriticalOrHigh = t.priority === 'CRITICAL' || t.priority === 'HIGH';

      return {
        ...t,
        isOverdue: isUnresolved && isOld,
        isUrgentAttention: isUnresolved && (isCriticalOrHigh || isOld),
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedTickets.length,
      tickets: enrichedTickets,
    });
  } catch (error) {
    console.error('getAllTickets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets queue.',
    });
  }
}

/**
 * Get aggregated overview statistics for the operations management dashboard
 * GET /api/admin/dashboard-stats
 */
export async function getAdminDashboardStats(req, res) {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      criticalTickets,
      highTickets,
      overdueTickets,
      categoriesBreakdown,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { status: 'CLOSED' } }),
      prisma.ticket.count({
        where: { priority: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.ticket.count({
        where: { priority: 'HIGH', status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.ticket.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdAt: { lt: fortyEightHoursAgo },
        },
      }),
      prisma.ticket.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
          book: { select: { title: true } },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalTickets,
        unresolvedTickets: openTickets + inProgressTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        criticalTickets,
        highTickets,
        urgentTickets: criticalTickets + highTickets,
        overdueTickets,
        categoriesBreakdown,
      },
      recentTickets,
    });
  } catch (error) {
    console.error('getAdminDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard statistics.',
    });
  }
}

/**
 * Get list of operational admins for assignment dropdown
 * GET /api/admin/team
 */
export async function getAdminTeam(req, res) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error('getAdminTeam error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin team members.',
    });
  }
}

export default {
  getAllTickets,
  getAdminDashboardStats,
  getAdminTeam,
};
