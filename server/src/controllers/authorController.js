import prisma from '../config/prisma.js';

/**
 * Get all books belonging to the authenticated author
 * GET /api/author/books
 */
export async function getMyBooks(req, res) {
  try {
    const authorId = req.user.id;

    const books = await prisma.book.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('getMyBooks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve books.',
    });
  }
}

/**
 * Get summary metrics & royalty statistics for author dashboard
 * GET /api/author/dashboard
 */
export async function getAuthorDashboardStats(req, res) {
  try {
    const authorId = req.user.id;

    // Fetch author details, books, and tickets in parallel
    const [books, tickets, author] = await Promise.all([
      prisma.book.findMany({
        where: { authorId },
      }),
      prisma.ticket.findMany({
        where: { authorId },
        select: { id: true, status: true },
      }),
      prisma.user.findUnique({
        where: { id: authorId },
        select: {
          id: true,
          name: true,
          email: true,
          authorCode: true,
          phone: true,
          city: true,
          joinedDate: true,
        },
      }),
    ]);

    // Calculate aggregated metrics
    const totalBooks = books.length;
    const publishedBooks = books.filter((b) => b.status === 'Published & Live').length;
    const inProductionBooks = books.filter((b) => b.status && b.status.startsWith('In Production')).length;

    const totalCopiesSold = books.reduce((sum, b) => sum + (b.totalCopiesSold || 0), 0);
    const totalRoyaltyEarned = books.reduce((sum, b) => sum + (b.totalRoyaltyEarned || 0), 0);
    const royaltyPaid = books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0);
    const royaltyPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);

    const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return res.status(200).json({
      success: true,
      author,
      stats: {
        totalBooks,
        publishedBooks,
        inProductionBooks,
        totalCopiesSold,
        totalRoyaltyEarned,
        royaltyPaid,
        royaltyPending,
        totalTickets: tickets.length,
        openTickets,
        resolvedTickets,
      },
      recentBooks: books.slice(0, 3),
    });
  } catch (error) {
    console.error('getAuthorDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate author dashboard statistics.',
    });
  }
}

/**
 * Get author dropdown options for ticket creation (Books or General)
 * GET /api/author/books-dropdown
 */
export async function getAuthorBooksDropdown(req, res) {
  try {
    const authorId = req.user.id;

    const books = await prisma.book.findMany({
      where: { authorId },
      select: {
        id: true,
        bookCode: true,
        title: true,
        isbn: true,
        status: true,
      },
      orderBy: { title: 'asc' },
    });

    return res.status(200).json({
      success: true,
      books,
    });
  } catch (error) {
    console.error('getAuthorBooksDropdown error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load books dropdown list.',
    });
  }
}

export default {
  getMyBooks,
  getAuthorDashboardStats,
  getAuthorBooksDropdown,
};
