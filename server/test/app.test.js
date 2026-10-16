import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateToken, verifyToken } from '../src/utils/jwt.js';
import { analyzeTicketAndGenerateDraft } from '../src/services/aiService.js';
import { BOOKLEAF_KNOWLEDGE_BASE } from '../src/knowledge/bookleafKnowledgeBase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('1. JWT Authentication & Security Token Tests', () => {
  it('should successfully sign and verify a valid JWT token', () => {
    const payload = {
      id: 'usr-test-123',
      email: 'priya.sharma@email.com',
      role: 'AUTHOR',
      name: 'Priya Sharma',
      authorCode: 'AUTH001',
    };

    const token = generateToken(payload);
    assert.ok(typeof token === 'string', 'Token should be a string');
    assert.ok(token.length > 20, 'Token should have valid length');

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.role, payload.role);
    assert.strictEqual(decoded.name, payload.name);
    assert.strictEqual(decoded.authorCode, payload.authorCode);
  });

  it('should reject tampered or invalid JWT tokens', () => {
    const validToken = generateToken({ id: 'user-1', role: 'AUTHOR' });
    const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

    assert.throws(
      () => {
        verifyToken(tamperedToken);
      },
      /invalid signature|jwt malformed/i,
      'Should throw an error on tampered token'
    );
  });
});

describe('2. AI Auto-Classification & Urgency Detection Tests', () => {
  it('should accurately classify a royalty payout query with high priority', async () => {
    const res = await analyzeTicketAndGenerateDraft({
      subject: 'Pending royalty payout for Q3',
      description: 'I sold 500 copies and haven’t received my payment of ₹11,970.',
      authorName: 'Priya Sharma',
      bookTitle: 'Whispers of the Ganges',
    });

    assert.strictEqual(res.category, 'ROYALTY_AND_PAYMENTS');
    assert.ok(['HIGH', 'CRITICAL'].includes(res.priority));
    assert.ok(typeof res.draftResponse === 'string');
    assert.ok(res.draftResponse.includes('Priya') || res.draftResponse.includes('Author'));
  });

  it('should flag wrong ISBN discrepancies as CRITICAL priority', async () => {
    const res = await analyzeTicketAndGenerateDraft({
      subject: 'Wrong ISBN printed on physical book and Amazon listing',
      description: 'The ISBN does not match the copyright page.',
      authorName: 'Rohit Kapoor',
      bookTitle: 'Code & Karma',
    });

    assert.strictEqual(res.category, 'ISBN_AND_METADATA_ISSUES');
    assert.strictEqual(res.priority, 'CRITICAL');
  });

  it('should classify blurry pages/binding issues as PRINTING_AND_QUALITY', async () => {
    const res = await analyzeTicketAndGenerateDraft({
      subject: 'Print quality defect on author copies',
      description: 'The pages are blurry and misaligned, need a reprint.',
      authorName: 'Vikram Joshi',
      bookTitle: 'Debugging Life',
    });

    assert.strictEqual(res.category, 'PRINTING_AND_QUALITY');
    assert.ok(typeof res.draftResponse === 'string');
  });

  it('should classify Amazon unavailable stock sync queries into DISTRIBUTION_AND_AVAILABILITY', async () => {
    const res = await analyzeTicketAndGenerateDraft({
      subject: 'Book showing currently unavailable on Amazon India',
      description: 'My book was published but readers say it is out of stock on Amazon.',
      authorName: 'Meera Nair',
      bookTitle: 'Cardamom & Chaos',
    });

    assert.strictEqual(res.category, 'DISTRIBUTION_AND_AVAILABILITY');
    assert.ok(['HIGH', 'MEDIUM'].includes(res.priority));
  });

  it('should classify cover design and typesetting questions into BOOK_STATUS_AND_PRODUCTION_UPDATES', async () => {
    const res = await analyzeTicketAndGenerateDraft({
      subject: 'Typesetting and cover design timeline query',
      description: 'How long will typesetting take before proofreading begins?',
      authorName: 'Sneha Kulkarni',
      bookTitle: 'Midnight in Mysore',
    });

    assert.strictEqual(res.category, 'BOOK_STATUS_AND_PRODUCTION_UPDATES');
    assert.ok(['LOW', 'MEDIUM'].includes(res.priority));
  });
});

describe('3. BookLeaf Knowledge Base Grounding & Policy Accuracy', () => {
  it('should accurately encode BookLeaf 80/20 royalty policy and ₹1,000 threshold', () => {
    const rp = BOOKLEAF_KNOWLEDGE_BASE.royaltyPolicy;
    assert.ok(rp.split.includes('80/20'));
    assert.ok(rp.minimumThreshold.includes('1,000'));
    assert.ok(rp.cycle.includes('quarterly'));
    assert.ok(rp.cycle.includes('45 days'));
  });

  it('should accurately encode BookLeaf printing and defect turnaround timelines', () => {
    const pq = BOOKLEAF_KNOWLEDGE_BASE.printingAndQuality;
    assert.ok(pq.turnaround.includes('5–7 business days'));
    assert.ok(pq.defectPolicy.includes('free reprint'));
  });

  it('should accurately encode stock sync resolution window', () => {
    const dist = BOOKLEAF_KNOWLEDGE_BASE.distributionAndAvailability;
    assert.ok(dist.stockSyncIssues.includes('24–48 hours'));
  });
});

describe('4. Sample Dataset Integrity & Edge Cases Tests', () => {
  it('should load all 10 authors and 18 books without missing records', () => {
    const sampleDataPath = path.resolve(__dirname, '../../bookleaf_sample_data.json');
    assert.ok(fs.existsSync(sampleDataPath), 'bookleaf_sample_data.json must exist');

    const raw = fs.readFileSync(sampleDataPath, 'utf-8');
    const data = JSON.parse(raw);

    assert.strictEqual(data.authors.length, 10, 'Must have exactly 10 authors');

    const totalBooks = data.authors.reduce((sum, a) => sum + a.books.length, 0);
    assert.strictEqual(totalBooks, 18, 'Must have exactly 18 books in total');
  });

  it('should preserve in-production edge cases (BK013 & BK015 null values)', () => {
    const sampleDataPath = path.resolve(__dirname, '../../bookleaf_sample_data.json');
    const data = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

    const allBooks = data.authors.flatMap((a) => a.books);
    const bk13 = allBooks.find((b) => b.book_id === 'BK013');
    const bk15 = allBooks.find((b) => b.book_id === 'BK015');

    assert.ok(bk13, 'BK013 must exist');
    assert.strictEqual(bk13.mrp, null, 'BK013 MRP must be null');
    assert.strictEqual(bk13.publication_date, null, 'BK013 date must be null');
    assert.strictEqual(bk13.status, 'In Production - Cover Design');

    assert.ok(bk15, 'BK015 must exist');
    assert.strictEqual(bk15.mrp, null, 'BK015 MRP must be null');
    assert.strictEqual(bk15.status, 'In Production - Typesetting');
  });
});
