# BookLeaf Publishing Assignment Write-Up: Engineering Approach & Architecture Decisions

**Position:** Full-Stack Developer  
**System:** Author Support & Communication Portal (AI-Powered)  
**Author:** Candidate Submission  

---

### 1. Approach & Prioritisation
To address BookLeaf’s operational challenge of processing 1,200+ monthly titles with a growing backlog of author communications, our engineering approach prioritized three pillars:

1. **Human-in-the-Loop AI Automation**: Rather than exposing raw generative AI directly to authors (which risks hallucinations or incorrect commitments regarding royalties and prints), the AI acts as an **expert co-pilot for operations admins**. Upon ticket creation, the system auto-classifies the query into one of BookLeaf's 6 specific operational categories, scores its priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and generates a draft reply strictly grounded in BookLeaf's Knowledge Base. The admin reviews and edits the draft before it is ever dispatched.
2. **Data Integrity & Domain Nuance**: We preserved 100% of the sample dataset (10 authors, 18 books) without modifying the schema or inventing mock substitutes. Edge cases such as books in production (`Midnight in Mysore`, `Raising Roots`) having `null` MRPs, `null` publication dates, and zero royalties were natively accommodated through nullable database columns and robust defensive rendering.
3. **Responsive Operational Experience**: Integrated Socket.IO for real-time synchronization. When an author raises a ticket, it appears instantly on the admin queue without polling. When an admin approves a draft, the author’s thread updates live.

---

### 2. Architectural Decisions & Trade-Offs

| Decision | Chosen Architecture | Trade-Off Made | Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Architecture** | Express.js with ES Modules & Layered Architecture (Controllers, Routes, Middlewares, Services, Knowledge) | Not using microservices | A clean modular monolith provides high velocity, zero network overhead between internal layers, and simplifies transactional database operations via Prisma ORM. |
| **Database & ORM** | PostgreSQL with Prisma ORM | Not using a schema-less NoSQL database (MongoDB) | Publishing catalogs require strict relational foreign keys (Authors $\rightarrow$ Books $\rightarrow$ Tickets $\rightarrow$ Messages). Prisma provides type-safe queries and automated schema migrations. |
| **Real-Time Layer** | WebSockets (Socket.IO) | Not using short-polling or Server-Sent Events (SSE) | Socket.IO provides full duplex bidirectional messaging, automatic reconnection, room-based scoping (`ticket_${id}`), and fallback to HTTP long-polling if WebSockets are blocked by corporate proxies. |
| **LLM & Cost Strategy** | Groq Cloud API with `llama-3.3-70b-versatile` + Targeted Knowledge Slices | Not sending full catalog or full knowledge base on every call | Sending the entire system manual on every query wastes tokens. We dynamically slice the relevant policy (Royalty, ISBN, Printing, or Distribution) based on lightweight keyword routing, keeping prompts compact ($\sim$450 tokens) and latency under 600ms. |
| **Graceful Degradation** | Heuristic fallback classification and priority scoring | Tickets never fail to create if the AI API is rate-limited | If Groq is offline or API key is absent, regex heuristics classify and assign priority, and generate an empathetic acknowledgment draft. Ticket creation is 100% resilient. |

---

### 3. How We Would Evolve This System in Production

If deployed to serve BookLeaf’s entire active catalog of 22,000+ titles across India and the US, we would introduce the following evolutions:

1. **RAG Vector Search with pgvector**: As the BookLeaf policy manual expands to include detailed state-by-state GST rules, overseas shipping carriers, and print partner SLA updates, we would embed knowledge chunks into PostgreSQL using `pgvector` for semantic cosine similarity search.
2. **Asynchronous Job Queue (Redis + BullMQ)**: Move AI classification and draft generation to a background worker queue so that ticket creation returns in under 50ms, with AI draft completion streamed asynchronously to the admin via WebSockets.
3. **Email Ingestion & Omnichannel Webhooks**: Allow authors to reply directly via email by parsing inbound SendGrid/SES webhooks and mapping them to the author's open ticket thread.
4. **Automated Defect Photo Verification via Vision AI**: Integrate LLaMA 3.2 Vision to inspect photos uploaded by authors for misprints, blurry typography, or damaged spines before issuing reprint authorizations.
5. **Role-Based Fine-Grained Permissions**: Segment admins into `FINANCE_ADMIN`, `PRODUCTION_DESK`, and `DISTRIBUTION_LEAD` so tickets are automatically routed to the relevant specialist queue.
