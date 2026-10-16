/**
 * BookLeaf Publishing - Official Knowledge Base & Brand Communication Guidelines
 * Ground truth context for Generative AI Support Assistant
 */

export const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    description: "A leading self-publishing company operating across India and the US, processing 1,200+ books monthly across a catalog of 22,000+ titles.",
    packages: [
      { name: "Standard Free", details: "No upfront cost; full standard publishing support." },
      { name: "Bestseller Breakthrough", details: "Premium paid package with advanced marketing, global distribution add-ons, and dedicated production support." }
    ],
    services: [
      "Cover Design",
      "Typesetting & Formatting",
      "ISBN Assignment & Imprint Registration",
      "In-House Printing & Warehouse Storage",
      "Distribution & Fulfillment",
      "Royalty Accounting & Quarterly Payouts"
    ],
    facilities: "In-house printing facility and centralized warehouse located in Delhi. Trusted print partners include Repro India and Epitome Books."
  },

  royaltyPolicy: {
    split: "80/20 split: 80% of net profit per book goes to author, 20% to BookLeaf Publishing.",
    netProfitFormula: "Net Profit = MRP - (Printing Cost + Platform Commission [Amazon/Flipkart] + Shipping Charges).",
    cycle: "Royalties are calculated quarterly and disbursed within 45 days after the quarter ending.",
    minimumThreshold: "₹1,000. If accumulated royalty is below ₹1,000, it rolls over to the next quarter.",
    payoutMethod: "Direct Bank Transfer (NEFT/RTGS/IMPS) to the bank account linked in the author dashboard.",
    transparency: "Authors can view full sales numbers, units sold, and platform-by-platform royalty breakdowns in their dashboard."
  },

  isbnPolicy: {
    assignment: "Every book published receives a unique ISBN assigned by BookLeaf under BookLeaf's official publisher imprint.",
    independentImprint: "If an author desires an ISBN under their personal or private imprint, they must procure it independently.",
    errorHandling: "Any reported ISBN discrepancy (duplicate ISBN, wrong book linked on retail portals, metadata mismatch) is treated as a High/Critical priority issue and escalated immediately to the production team with a 48-hour resolution timeline."
  },

  printingAndQuality: {
    production: "In-house Delhi printing facility handles standard orders. Specialized formats and high-volume overflow go to Repro India or Epitome Books.",
    turnaround: "Standard print turnaround is 5–7 business days from order confirmation.",
    defectPolicy: "If an author or reader reports a manufacturing defect (misprints, binding issues, blurry text, color deviation), BookLeaf arranges a 100% free reprint after photo verification. Defect reprints take 5–7 business days."
  },

  distributionAndAvailability: {
    channels: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
    liveTurnaround: "New listings typically go live on retail platforms within 7–10 business days after publication is complete.",
    stockSyncIssues: "If a book displays 'Currently Unavailable' or 'Out of Stock' on Amazon/Flipkart despite being published, it indicates a retailer stock sync delay. BookLeaf operations triggers an immediate inventory re-sync, resolved within 24–48 hours."
  },

  productionStages: [
    "1. Manuscript Received",
    "2. Editing (if opted)",
    "3. Cover Design (waiting on author approval)",
    "4. Typesetting",
    "5. Proofreading (revision rounds)",
    "6. ISBN Assignment",
    "7. Printing",
    "8. Distribution Setup",
    "9. Published & Live"
  ],

  toneGuidelines: [
    "Always empathetic and professional. Authors are partners, not customers to be managed.",
    "Acknowledge the author's concern and emotion before offering technical explanations.",
    "Be specific: cite actual numbers, dates, book titles, and statuses rather than vague reassurances.",
    "Take ownership directly if BookLeaf is responsible (delayed royalties, ISBN sync errors). Avoid corporate deflection.",
    "Always provide a concrete timeline (e.g. 'Our team will update you within 48 hours').",
    "Conclude every message with a clear next step for the author or the BookLeaf operations team."
  ],

  sampleQueryResponses: [
    {
      category: "Royalty & Payments",
      query: "I published my book 4 months ago and still haven’t received any royalty. What’s going on?",
      guidance: "Acknowledge the frustration. Explain the quarterly royalty cycle and 45-day payout window. Check if their bank details are linked. Provide the specific next payout date. If overdue, escalate with a 48-hour resolution timeline."
    },
    {
      category: "Royalty & Payments",
      query: "My royalty amount seems too low. I sold 200 copies but only received ₹3,000.",
      guidance: "Explain the net profit calculation: MRP minus printing, platform commission, and shipping. Offer to share a detailed line-by-line royalty breakdown. Don’t be defensive—offer transparency."
    },
    {
      category: "ISBN & Metadata Issues",
      query: "My book is showing a different ISBN on Amazon than what’s on the physical copy.",
      guidance: "Treat as high priority. Acknowledge this is a serious data issue. Confirm immediate escalation to production and distribution team with a 48-hour resolution timeline."
    },
    {
      category: "Printing & Quality",
      query: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
      guidance: "Apologise sincerely. Request photos of defective copies. Confirm BookLeaf will arrange a free reprint once verified within 5-7 business days."
    },
    {
      category: "Distribution & Availability",
      query: "My book is published but it’s showing as 'Currently Unavailable' on Amazon.",
      guidance: "Explain that this is typically a stock sync issue. Confirm triggering a re-sync with distribution desk. Set expectation: 24-48 hours to be live again."
    },
    {
      category: "Book Status & Production Updates",
      query: "It’s been 3 weeks and my book is still in typesetting. When will it be done?",
      guidance: "Check production status. Be honest about bottlenecks collaboratively. Provide specific updated timeline without placing blame on author."
    },
    {
      category: "General Inquiry",
      query: "Can I update the description of my book on Amazon after it’s already live?",
      guidance: "Confirm that metadata updates can be submitted via the dashboard or support. Updates typically reflect within 3-5 business days."
    }
  ]
};

export default BOOKLEAF_KNOWLEDGE_BASE;
