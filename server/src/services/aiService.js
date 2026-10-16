import 'dotenv/config';
import Groq from 'groq-sdk';
import { BOOKLEAF_KNOWLEDGE_BASE } from '../knowledge/bookleafKnowledgeBase.js';

function getGroqClient() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.includes('your_groq_api_key')) {
    return null;
  }
  try {
    return new Groq({ apiKey: groqApiKey });
  } catch (err) {
    console.warn('⚠️ Groq SDK initialization warning:', err.message);
    return null;
  }
}

function getGroqModel() {
  return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
}


/**
 * Heuristic fallback for category classification when AI is offline
 */
function heuristicClassify(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('royalt') || lower.includes('payment') || lower.includes('payout') || lower.includes('earning') || lower.includes('bank') || lower.includes('money') || lower.includes('threshold')) {
    return 'ROYALTY_AND_PAYMENTS';
  }
  if (lower.includes('isbn') || lower.includes('barcode') || lower.includes('metadata') || lower.includes('imprint') || lower.includes('wrong book')) {
    return 'ISBN_AND_METADATA_ISSUES';
  }
  if (lower.includes('print') || lower.includes('quality') || lower.includes('blurry') || lower.includes('binding') || lower.includes('defect') || lower.includes('misprint') || lower.includes('pages')) {
    return 'PRINTING_AND_QUALITY';
  }
  if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('unavailable') || lower.includes('out of stock') || lower.includes('listing') || lower.includes('store')) {
    return 'DISTRIBUTION_AND_AVAILABILITY';
  }
  if (lower.includes('typesetting') || lower.includes('cover') || lower.includes('proofreading') || lower.includes('stage') || lower.includes('when will') || lower.includes('manuscript') || lower.includes('progress')) {
    return 'BOOK_STATUS_AND_PRODUCTION_UPDATES';
  }
  return 'GENERAL_INQUIRY';
}

/**
 * Heuristic fallback for priority estimation when AI is offline
 */
function heuristicPriority(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('urgent') || lower.includes('wrong isbn') || lower.includes('critical') || lower.includes('emergency') || lower.includes('severe') || lower.includes('legal') || (lower.includes('royalty') && (lower.includes('6 months') || lower.includes('never')))) {
    return 'CRITICAL';
  }
  if (lower.includes('pending') || lower.includes('delayed') || lower.includes('defect') || lower.includes('not working') || lower.includes('error') || lower.includes('missing')) {
    return 'HIGH';
  }
  if (lower.includes('bio') || lower.includes('thank') || lower.includes('query') || lower.includes('general') || lower.includes('question')) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * Construct contextual knowledge base slice to optimize token costs
 */
function getTargetedKnowledgeSlice(categoryHint) {
  const kb = BOOKLEAF_KNOWLEDGE_BASE;
  let relevantPolicies = '';

  switch (categoryHint) {
    case 'ROYALTY_AND_PAYMENTS':
      relevantPolicies = `Royalty Policy: ${JSON.stringify(kb.royaltyPolicy)}`;
      break;
    case 'ISBN_AND_METADATA_ISSUES':
      relevantPolicies = `ISBN Policy: ${JSON.stringify(kb.isbnPolicy)}`;
      break;
    case 'PRINTING_AND_QUALITY':
      relevantPolicies = `Printing & Quality Policy: ${JSON.stringify(kb.printingAndQuality)}`;
      break;
    case 'DISTRIBUTION_AND_AVAILABILITY':
      relevantPolicies = `Distribution Policy: ${JSON.stringify(kb.distributionAndAvailability)}`;
      break;
    case 'BOOK_STATUS_AND_PRODUCTION_UPDATES':
      relevantPolicies = `Production Stages: ${JSON.stringify(kb.productionStages)}`;
      break;
    default:
      relevantPolicies = `Company Overview: ${JSON.stringify(kb.company)}`;
  }

  return `
Company Overview: ${kb.company.name} (${kb.company.facilities})
Key Policy Context:
${relevantPolicies}

Communication Tone Rules:
- Empathetic and professional. Treat authors as publishing partners.
- Acknowledge their concern first.
- Be specific: cite dates, numbers, and policies where applicable.
- Take direct ownership if an issue is on BookLeaf's end.
- Give a concrete timeline (e.g. 24-48 hours, or 5-7 business days).
- Conclude with clear next steps.
`;
}

/**
 * Analyze incoming ticket content:
 * 1. Categorize into 1 of 6 valid categories
 * 2. Suggest priority (CRITICAL, HIGH, MEDIUM, LOW)
 * 3. Generate initial response draft grounded in BookLeaf Knowledge Base
 *
 * @param {Object} params - { subject, description, authorName, bookTitle, bookDetails }
 * @returns {Promise<Object>} { category, priority, confidence, draftResponse, source }
 */
export async function analyzeTicketAndGenerateDraft({
  subject,
  description,
  authorName = 'Author',
  bookTitle = null,
  bookDetails = null,
}) {
  const initialCategoryHint = heuristicClassify(`${subject} ${description}`);
  const initialPriorityHint = heuristicPriority(`${subject} ${description}`);

  // Fallback defaults in case Groq is unavailable or key not configured
  const fallbackResult = {
    category: initialCategoryHint,
    priority: initialPriorityHint,
    confidence: 0.85,
    draftResponse: `Dear ${authorName},

Thank you for reaching out to the BookLeaf Publishing support team.

We have received your query regarding "${subject}"${bookTitle ? ` concerning your book "${bookTitle}"` : ''}. Our operations desk has flagged this for immediate review.

${
  initialCategoryHint === 'ROYALTY_AND_PAYMENTS'
    ? 'Please note that BookLeaf processes royalties on a quarterly cycle within 45 days after quarter-end for balances meeting the ₹1,000 threshold. We are verifying your account records with our finance desk.'
    : initialCategoryHint === 'ISBN_AND_METADATA_ISSUES'
    ? 'We treat catalog and ISBN metadata with highest urgency. Our production team is reviewing the listing details to ensure consistency across all retail channels.'
    : initialCategoryHint === 'PRINTING_AND_QUALITY'
    ? 'If this inquiry is regarding print quality, please rest assured that BookLeaf arranges free reprints for verified defects. Our quality team will follow up shortly.'
    : 'Our specialized team is investigating this and will provide a comprehensive update within 24 to 48 business hours.'
}

We value your partnership and are dedicated to ensuring your publishing journey is smooth.

Warm regards,
BookLeaf Support Team`,
    source: 'heuristic_fallback',
  };

  const groq = getGroqClient();
  const groqModel = getGroqModel();

  // If Groq client is not initialized, return graceful fallback
  if (!groq) {
    return fallbackResult;
  }

  try {
    const knowledgeContext = getTargetedKnowledgeSlice(initialCategoryHint);

    const systemPrompt = `You are the Senior Operations & Support AI Assistant at BookLeaf Publishing.
Your task is to analyze an incoming author support query, accurately classify it, assign a priority score, and draft a high-quality, empathetic, knowledge-grounded response.

You must respond ONLY with a valid JSON object matching this exact schema:
{
  "category": "ROYALTY_AND_PAYMENTS" | "ISBN_AND_METADATA_ISSUES" | "PRINTING_AND_QUALITY" | "DISTRIBUTION_AND_AVAILABILITY" | "BOOK_STATUS_AND_PRODUCTION_UPDATES" | "GENERAL_INQUIRY",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": 0.95,
  "draftResponse": "Your empathetic, professional, and specific draft reply here."
}

Category Rules:
- ROYALTY_AND_PAYMENTS: Payout delays, 80/20 split, net profit calculation, minimum ₹1,000 threshold, bank details.
- ISBN_AND_METADATA_ISSUES: Mismatched ISBN on Amazon/Flipkart, wrong title, author name correction, imprint questions.
- PRINTING_AND_QUALITY: Blurry pages, binding defects, damaged author copies, reprint requests (5-7 days turnaround).
- DISTRIBUTION_AND_AVAILABILITY: Book showing 'Currently Unavailable' on Amazon/Flipkart, stock sync delays (24-48 hours).
- BOOK_STATUS_AND_PRODUCTION_UPDATES: Manuscript stage, cover design feedback, typesetting delays, proofreading rounds.
- GENERAL_INQUIRY: Account settings, package upgrades, general guidelines.

Priority Rules:
- CRITICAL: Severe data errors (wrong ISBN), royalty missing for over 6 months, blocking live sales.
- HIGH: Royalty payout questions, damaged copy reports, distribution stock sync issues.
- MEDIUM: Production progress updates, timeline inquiries, author proof inquiries.
- LOW: Minor bio changes, general information questions, compliments.

Knowledge Base Context:
${knowledgeContext}
`;

    const userPrompt = `Incoming Author Query:
Author Name: ${authorName}
Related Book: ${bookTitle ? bookTitle : 'General / Account Level'}
${bookDetails ? `Book Details: ${JSON.stringify(bookDetails)}` : ''}
Subject: ${subject}
Description: ${description}

Analyze this query and return the JSON classification, priority, and knowledge-grounded draft response.`;

    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // Low temperature for consistent classification
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return fallbackResult;
    }

    const parsed = JSON.parse(responseContent);

    // Validate enum values
    const validCategories = [
      'ROYALTY_AND_PAYMENTS',
      'ISBN_AND_METADATA_ISSUES',
      'PRINTING_AND_QUALITY',
      'DISTRIBUTION_AND_AVAILABILITY',
      'BOOK_STATUS_AND_PRODUCTION_UPDATES',
      'GENERAL_INQUIRY',
    ];
    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

    const category = validCategories.includes(parsed.category)
      ? parsed.category
      : initialCategoryHint;
    const priority = validPriorities.includes(parsed.priority)
      ? parsed.priority
      : initialPriorityHint;

    return {
      category,
      priority,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
      draftResponse: parsed.draftResponse || fallbackResult.draftResponse,
      source: 'groq_ai',
    };
  } catch (err) {
    console.error('Groq AI generation error (falling back to graceful heuristic):', err.message);
    return fallbackResult;
  }
}

/**
 * Generate real-time AI reply for ongoing ticket thread
 */
export async function generateThreadReply({
  ticket,
  conversationHistory = [],
  authorMessage,
  authorName = 'Author',
}) {
  const groq = getGroqClient();
  const groqModel = getGroqModel();

  const category = ticket?.category || heuristicClassify(authorMessage);
  const knowledgeContext = getTargetedKnowledgeSlice(category);

  // Fallback response if AI is unavailable
  const fallbackReply = `Dear ${authorName},

Thank you for your message regarding "${ticket?.subject || 'your query'}".

Our operations team has received your update and is actively reviewing the details. We will provide a complete resolution within 24–48 business hours.

Warm regards,
BookLeaf Support Desk`;

  if (!groq) {
    return fallbackReply;
  }

  try {
    const formattedHistory = conversationHistory
      .slice(-6)
      .map((m) => `${m.sender?.role === 'AUTHOR' ? authorName : 'BookLeaf Support'}: ${m.message}`)
      .join('\n\n');

    const systemPrompt = `You are the Senior Operations & Support AI Assistant at BookLeaf Publishing.
You are chatting live with an author in an active support ticket thread.

Your goals:
1. Provide a direct, empathetic, and specific response grounded in BookLeaf's policies.
2. If they ask about royalties, explain the quarterly cycle (45 days post-quarter), ₹1,000 threshold, and 80/20 net profit split.
3. If they ask about print quality or defects, confirm BookLeaf will provide a free reprint within 5-7 business days once photos are verified.
4. If they ask about availability (e.g. Amazon/Flipkart), explain stock sync delays and that an inventory re-sync takes 24-48 hours.
5. If they ask about book production stages (cover design, typesetting, ISBN), provide clear status expectations.
6. Keep replies concise, helpful, professional, and empathetic (2-3 paragraphs max). Do not hallucinate policies outside the knowledge base.

Knowledge Base Context:
${knowledgeContext}
`;

    const userPrompt = `Ticket Context:
Ticket Number: ${ticket?.ticketNumber || 'N/A'}
Subject: ${ticket?.subject || 'N/A'}
Related Book: ${ticket?.book?.title || 'Account / General Query'}
Author Name: ${authorName}

Recent Conversation History:
${formattedHistory || '(No previous messages)'}

Author's Latest Message:
"${authorMessage}"

Please provide a helpful, empathetic, and definitive response for the author.`;

    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    return reply || fallbackReply;
  } catch (err) {
    console.error('Groq AI thread reply error:', err.message);
    return fallbackReply;
  }
}

export default {
  analyzeTicketAndGenerateDraft,
  generateThreadReply,
};

