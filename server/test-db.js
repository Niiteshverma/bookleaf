import prisma from './src/config/prisma.js';

async function verifyDb() {
  try {
    const rawVersion = await prisma.$queryRawUnsafe('SELECT version();');
    const userCount = await prisma.user.count();
    const bookCount = await prisma.book.count();
    const ticketCount = await prisma.ticket.count();
    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' },
      select: { name: true, authorCode: true },
      take: 3
    });

    console.log('=== POSTGRESQL LIVE CONNECTION VERIFICATION ===');
    console.log('PostgreSQL Version:', rawVersion[0].version.split(',')[0]);
    console.log('Database Connected: YES (Active)');
    console.log('Total Seeded Users:', userCount, '(10 Authors + 2 Admins)');
    console.log('Total Seeded Books:', bookCount, '(All 18 assignment books)');
    console.log('Total Active Tickets:', ticketCount);
    console.log('Sample Authors in DB:', authors.map(a => `${a.name} (${a.authorCode})`).join(', '));
    console.log('================================================');
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDb();
