import { PrismaClient, Role, TicketStatus, TicketCategory, TicketPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BookLeaf database seeding...');

  // 1. Load bookleaf_sample_data.json
  const sampleDataPath = path.resolve(__dirname, '../../bookleaf_sample_data.json');
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at: ${sampleDataPath}`);
  }

  const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
  const sampleData = JSON.parse(rawData);

  // Default hashed passwords
  const defaultAuthorPassword = await bcrypt.hash('author123', 10);
  const defaultAdminPassword = await bcrypt.hash('admin123', 10);

  // 2. Seed Admin Users
  console.log('👤 Seeding Admin users...');
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@bookleaf.com' },
    update: {},
    create: {
      name: 'Aditi Verma (Operations Lead)',
      email: 'admin@bookleaf.com',
      password: defaultAdminPassword,
      role: Role.ADMIN,
      phone: '+91-99887-76655',
      city: 'Delhi',
      joinedDate: new Date('2022-01-15'),
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'support@bookleaf.com' },
    update: {},
    create: {
      name: 'Karan Mehra (Support Specialist)',
      email: 'support@bookleaf.com',
      password: defaultAdminPassword,
      role: Role.ADMIN,
      phone: '+91-99887-76656',
      city: 'Delhi',
      joinedDate: new Date('2022-05-10'),
    },
  });

  console.log(`✅ Admin users seeded: ${admin1.email}, ${admin2.email}`);

  // 3. Seed Authors and their Books from bookleaf_sample_data.json
  console.log(`📚 Seeding ${sampleData.authors.length} authors and their books...`);

  const createdAuthors = [];
  const createdBooks = [];

  for (const authorData of sampleData.authors) {
    const author = await prisma.user.upsert({
      where: { email: authorData.email },
      update: {
        name: authorData.name,
        phone: authorData.phone,
        city: authorData.city,
        authorCode: authorData.author_id,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      },
      create: {
        authorCode: authorData.author_id,
        name: authorData.name,
        email: authorData.email,
        password: defaultAuthorPassword,
        role: Role.AUTHOR,
        phone: authorData.phone,
        city: authorData.city,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : null,
      },
    });

    createdAuthors.push(author);

    // Seed Books for this author
    for (const b of authorData.books) {
      const book = await prisma.book.upsert({
        where: { bookCode: b.book_id },
        update: {
          title: b.title,
          isbn: b.isbn,
          genre: b.genre,
          publicationDate: b.publication_date ? new Date(b.publication_date) : null,
          status: b.status,
          mrp: b.mrp !== null ? parseFloat(b.mrp) : null,
          authorRoyaltyPerCopy: b.author_royalty_per_copy !== null ? parseFloat(b.author_royalty_per_copy) : null,
          totalCopiesSold: b.total_copies_sold || 0,
          totalRoyaltyEarned: b.total_royalty_earned !== null ? parseFloat(b.total_royalty_earned) : 0,
          royaltyPaid: b.royalty_paid !== null ? parseFloat(b.royalty_paid) : 0,
          royaltyPending: b.royalty_pending !== null ? parseFloat(b.royalty_pending) : 0,
          lastRoyaltyPayoutDate: b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : null,
          printPartner: b.print_partner || null,
          availableOn: b.available_on || [],
          authorId: author.id,
        },
        create: {
          bookCode: b.book_id,
          title: b.title,
          isbn: b.isbn,
          genre: b.genre,
          publicationDate: b.publication_date ? new Date(b.publication_date) : null,
          status: b.status,
          mrp: b.mrp !== null ? parseFloat(b.mrp) : null,
          authorRoyaltyPerCopy: b.author_royalty_per_copy !== null ? parseFloat(b.author_royalty_per_copy) : null,
          totalCopiesSold: b.total_copies_sold || 0,
          totalRoyaltyEarned: b.total_royalty_earned !== null ? parseFloat(b.total_royalty_earned) : 0,
          royaltyPaid: b.royalty_paid !== null ? parseFloat(b.royalty_paid) : 0,
          royaltyPending: b.royalty_pending !== null ? parseFloat(b.royalty_pending) : 0,
          lastRoyaltyPayoutDate: b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : null,
          printPartner: b.print_partner || null,
          availableOn: b.available_on || [],
          authorId: author.id,
        },
      });

      createdBooks.push(book);
    }
  }

  console.log(`✅ Seeded ${createdAuthors.length} authors and ${createdBooks.length} books.`);

  // 4. Seed Representative Test Tickets to test the Admin Queue & AI draft flows immediately
  console.log('🎫 Seeding initial test support tickets...');

  // Sample Ticket 1: Royalty Query from Priya Sharma (AUTH001)
  const priya = createdAuthors.find((a) => a.authorCode === 'AUTH001');
  const whispersBook = createdBooks.find((b) => b.bookCode === 'BK001');

  if (priya && whispersBook) {
    const existingTicket1 = await prisma.ticket.findUnique({
      where: { ticketNumber: 'BL-1001' },
    });

    if (!existingTicket1) {
      const ticket1 = await prisma.ticket.create({
        data: {
          ticketNumber: 'BL-1001',
          authorId: priya.id,
          bookId: whispersBook.id,
          subject: 'Pending royalty payout for Q3 2025',
          description:
            'Hello team, my dashboard shows ₹3,570 as pending royalty for Whispers of the Ganges. The last payout was on 15th October 2025. Could you please confirm when the remaining pending royalty will be credited to my account?',
          status: TicketStatus.OPEN,
          category: TicketCategory.ROYALTY_AND_PAYMENTS,
          priority: TicketPriority.HIGH,
          aiCategory: TicketCategory.ROYALTY_AND_PAYMENTS,
          aiPriority: TicketPriority.HIGH,
          aiConfidence: 0.94,
          aiDraftResponse:
            'Dear Priya, thank you for reaching out to BookLeaf Publishing. We understand your concern regarding the pending royalty of ₹3,570 for "Whispers of the Ganges". BookLeaf calculates royalties on a quarterly cycle with payouts disbursed within 45 days after quarter-end. Your pending balance meets our ₹1,000 threshold and is scheduled for the upcoming payout cycle. Our finance desk is verifying the transfer details, and we will update you within 48 hours.',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago (shows up as older unresolved)
        },
      });

      // Initial author message in conversation
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket1.id,
          senderId: priya.id,
          message:
            'Hello team, my dashboard shows ₹3,570 as pending royalty for Whispers of the Ganges. The last payout was on 15th October 2025. Could you please confirm when the remaining pending royalty will be credited to my account?',
        },
      });

      // Internal note by admin
      await prisma.internalNote.create({
        data: {
          ticketId: ticket1.id,
          authorId: admin1.id,
          note: 'Checked bank records. Bank account verified. Payout queued for batch run next Tuesday.',
        },
      });
    }
  }

  // Sample Ticket 2: ISBN Discrepancy from Rohit Kapoor (AUTH002) - CRITICAL
  const rohit = createdAuthors.find((a) => a.authorCode === 'AUTH002');
  const codeKarma = createdBooks.find((b) => b.bookCode === 'BK003');

  if (rohit && codeKarma) {
    const existingTicket2 = await prisma.ticket.findUnique({
      where: { ticketNumber: 'BL-1002' },
    });

    if (!existingTicket2) {
      const ticket2 = await prisma.ticket.create({
        data: {
          ticketNumber: 'BL-1002',
          authorId: rohit.id,
          bookId: codeKarma.id,
          subject: 'URGENT: Wrong ISBN showing on Amazon India product page',
          description:
            'My book Code & Karma is showing a different ISBN on Amazon India than what is printed on the physical copy received by readers. This is causing confusion with order fulfillments.',
          status: TicketStatus.IN_PROGRESS,
          category: TicketCategory.ISBN_AND_METADATA_ISSUES,
          priority: TicketPriority.CRITICAL,
          aiCategory: TicketCategory.ISBN_AND_METADATA_ISSUES,
          aiPriority: TicketPriority.CRITICAL,
          aiConfidence: 0.98,
          aiDraftResponse:
            'Dear Rohit, we treat ISBN discrepancies with the utmost priority. We sincerely apologize for this data issue on Amazon India. We have immediately escalated this to our metadata and production desk to trigger a catalog re-sync with Amazon. You will receive an official update within 24 to 48 hours.',
          assignedToId: admin1.id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      });

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket2.id,
          senderId: rohit.id,
          message:
            'My book Code & Karma is showing a different ISBN on Amazon India than what is printed on the physical copy received by readers. This is causing confusion with order fulfillments.',
        },
      });

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket2.id,
          senderId: admin1.id,
          message:
            'Hi Rohit, we acknowledge this serious issue. Our team has triggered a priority re-sync ticket with Repro India and Amazon catalog support. We are tracking this closely.',
        },
      });
    }
  }

  // Sample Ticket 3: Production Inquiry from Sneha Kulkarni (AUTH007)
  const sneha = createdAuthors.find((a) => a.authorCode === 'AUTH007');
  const mysoreBook = createdBooks.find((b) => b.bookCode === 'BK013');

  if (sneha && mysoreBook) {
    const existingTicket3 = await prisma.ticket.findUnique({
      where: { ticketNumber: 'BL-1003' },
    });

    if (!existingTicket3) {
      const ticket3 = await prisma.ticket.create({
        data: {
          ticketNumber: 'BL-1003',
          authorId: sneha.id,
          bookId: mysoreBook.id,
          subject: 'Status of cover design revisions for Midnight in Mysore',
          description:
            'Hi, I submitted feedback on the cover design proofs 10 days ago. Could you please share when the updated front cover will be ready for review?',
          status: TicketStatus.OPEN,
          category: TicketCategory.BOOK_STATUS_AND_PRODUCTION_UPDATES,
          priority: TicketPriority.MEDIUM,
          aiCategory: TicketCategory.BOOK_STATUS_AND_PRODUCTION_UPDATES,
          aiPriority: TicketPriority.MEDIUM,
          aiConfidence: 0.91,
          aiDraftResponse:
            'Dear Sneha, thank you for checking in on "Midnight in Mysore". Our design studio has incorporated your feedback on typography and palette. The revised cover proof is currently undergoing final quality check and will be uploaded to your dashboard within 2 business days.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket3.id,
          senderId: sneha.id,
          message:
            'Hi, I submitted feedback on the cover design proofs 10 days ago. Could you please share when the updated front cover will be ready for review?',
        },
      });
    }
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
