# 🍃 BookLeaf Publishing — Author Support & Communication Portal

An AI-powered, real-time communication portal built for **BookLeaf Publishing** to streamline author communication at scale across 22,000+ titles.

The system features two tailored interfaces:
1. **Author Portal**: Authors can view personal published and in-production books, track royalty earnings/disbursements, submit support queries linked to specific books or general account inquiries, and chat live with BookLeaf operations.
2. **Admin Operations Portal**: BookLeaf team manages incoming queries with advanced multi-filters (status, priority, category, date), spots urgent/overdue tickets (>48h), overrides classifications, writes private internal notes, and reviews/edits **knowledge-grounded AI-generated response drafts** before dispatching them.

---

## 🚀 Live Demo Credentials

Use these pre-seeded accounts to evaluate the portal immediately:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Lead | `admin@bookleaf.com` | `admin123` | Full access to ticket queue, AI drafts, internal notes & overrides |
| **Admin** | Support Specialist | `support@bookleaf.com` | `admin123` | Operational support desk access |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `author123` | ID: `AUTH001`, 2 published books, pending royalty |
| **Author** | Rohit Kapoor | `rohit.kapoor@email.com` | `author123` | ID: `AUTH002`, 2 published books, high sales volume |
| **Author** | Sneha Kulkarni | `sneha.kulkarni@email.com` | `author123` | ID: `AUTH007`, 3 books (includes book in Cover Design) |

> 💡 **Quick Login:** The login page features single-click demo credential buttons for instant review.

---

## 🛠️ Technology Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | High performance, instant HMR, clean maintainable component design system tailored to BookLeaf branding. |
| **Routing & HTTP** | React Router v6, Axios | Protected routes with JWT interceptors, auto-redirect on session expiry. |
| **Backend** | Node.js, Express.js (ES Modules) | Native ES imports (`import/export`), structured controllers, services, middlewares, and routes. |
| **Database & ORM** | PostgreSQL, Prisma ORM | Relational data integrity for authors, books, tickets, messages, notes, and strict enum typing. |
| **Generative AI** | Groq Cloud API (`llama-3.3-70b-versatile`) | Blazing fast inference ($\sim$500ms), high reasoning capability for accurate policy grounding, cost-effective token usage. |
| **Real-time** | Socket.IO (WebSockets) | Instant bidirectional sync: admins receive new tickets live; authors receive replies without page refresh. |
| **Security** | JWT, bcryptjs, RBAC | Passwords hashed with 10 salt rounds; author endpoints strictly scoped to `req.user.id`; internal notes private to admins. |

---

## 🧠 AI Architecture & Prompt Strategy

### 1. Auto-Classification (6 Specific Assignment Categories)
Incoming tickets are analyzed and categorized into:
- `ROYALTY_AND_PAYMENTS`
- `ISBN_AND_METADATA_ISSUES`
- `PRINTING_AND_QUALITY`
- `DISTRIBUTION_AND_AVAILABILITY`
- `BOOK_STATUS_AND_PRODUCTION_UPDATES`
- `GENERAL_INQUIRY`

### 2. Urgency & Priority Detection
Scores urgency into:
- `CRITICAL` (e.g. wrong ISBN on Amazon India, uncredited royalties >6 months)
- `HIGH` (e.g. pending payout inquiries, defect reprints)
- `MEDIUM` (e.g. cover design update, timeline checks)
- `LOW` (e.g. bio updates, general questions)

### 3. Knowledge-Base Grounded Draft Response
The AI response draft is constructed using BookLeaf's actual operating policies:
- **80/20 royalty split** on net profit (MRP minus printing, platform commission, shipping).
- **Quarterly payouts** within 45 days after quarter end.
- **₹1,000 threshold** (balances below roll over to next quarter).
- **5–7 business days** turnaround for in-house printing & free defect reprints.
- **24–48 hours** stock sync resolution for unavailable retail listings.
- **Empathetic and collaborative tone** without corporate deflection.

### 4. Cost Awareness & Token Optimization
Rather than dumping the entire 22,000-book catalog or all policies into every prompt, the backend extracts a **targeted policy slice** based on query intent. Prompts average under 450 tokens, keeping execution fast and inexpensive.

### 5. Graceful Degradation / Offline Resilience
If Groq API encounters network issues, rate limits, or if an API key is missing, the system automatically falls back to an **intelligent regex-based heuristic classifier and priority analyzer**, producing an empathetic draft acknowledgment. **Ticket creation never fails due to an external AI error.**

---

## 💻 Local Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended; developed on Node v25)
- npm (v9 or higher)
- A PostgreSQL connection string (Local or Cloud like [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com))

### Step 1: Clone Repository & Install Root Orchestrator
```bash
git clone <repo-url>
cd BOOKLEAF
npm install
```

### Step 2: Configure Environment Variables
Inside `server/`, create `.env` using `.env.example`:
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Paste your PostgreSQL connection URL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/bookleaf_db?schema=public"

# JWT configuration
JWT_SECRET=bookleaf_super_secret_jwt_key_2026_xyz
JWT_EXPIRES_IN=7d

# Groq Cloud API Key (Free from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### Step 3: Run Database Migrations & Seed Sample Dataset
In the `server/` directory:
```bash
# Push schema to database
npx prisma db push

# Seed 10 authors, 18 books, admins, and test tickets
node prisma/seed.js
```

### Step 4: Run Application (Parallel Dev Mode)
From the root directory:
```bash
npm run dev
```
This concurrently starts:
- **Backend API & WebSockets:** `http://localhost:5000`
- **Frontend Vite Dev Server:** `http://localhost:5173`

---

## 📡 API Documentation Overview

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate Author or Admin and issue JWT token |
| `GET` | `/api/auth/me` | Protected | Fetch authenticated user profile |
| `GET` | `/api/author/books` | Author | Retrieve all published and in-production books |
| `GET` | `/api/author/dashboard` | Author | Aggregated royalty metrics, copies sold, tickets summary |
| `GET` | `/api/author/books-dropdown` | Author | Lightweight dropdown list for ticket creation |
| `POST` | `/api/tickets` | Author | Raise ticket, triggers AI classification and draft |
| `GET` | `/api/tickets/my-tickets` | Author | View all personal tickets and latest replies |
| `GET` | `/api/tickets/:id` | Shared | View conversation (Internal notes stripped for Authors) |
| `POST` | `/api/tickets/:id/messages` | Shared | Post reply message to conversation |
| `GET` | `/api/admin/tickets` | Admin | Multi-filtered ticket queue (status, priority, date, search) |
| `GET` | `/api/admin/dashboard-stats` | Admin | Unresolved backlog, urgent tickets, overdue counts |
| `GET` | `/api/admin/team` | Admin | Operations team list for ticket assignment |
| `POST` | `/api/tickets/:id/approve-ai-draft` | Admin | Edit and approve AI draft response to author |
| `PATCH` | `/api/tickets/:id/status` | Admin | Update status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) |
| `PATCH` | `/api/tickets/:id/classification` | Admin | Override category and priority |
| `PATCH` | `/api/tickets/:id/assign` | Admin | Assign ticket to specialist |
| `POST` | `/api/tickets/:id/internal-notes` | Admin | Add private operational note |
| `GET` | `/api/health` | Public | System status and uptime verification |

*A complete Postman collection is included in [`postman_collection.json`](./postman_collection.json).*

---

## 📂 Project Directory Structure

```
BOOKLEAF/
├── bookleaf_sample_data.json         # Master assignment dataset (10 authors, 18 books)
├── package.json                      # Root workspace orchestrator (concurrently)
├── .gitignore                        # Credentials and artifacts exclusion
├── postman_collection.json           # Complete API test suite
├── ASSIGNMENT_WRITEUP.md             # 1-page design & approach writeup
├── README.md                         # Project documentation
│
├── server/                           # Backend API (Node.js + Express + Prisma)
│   ├── .env.example                  # Environment configuration template
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma             # Relational PostgreSQL schema
│   │   └── seed.js                   # Dataset seeder
│   └── src/
│       ├── app.js                    # Express configuration & middleware
│       ├── server.js                 # HTTP & Socket.IO server startup
│       ├── config/prisma.js          # Prisma Client singleton
│       ├── controllers/              # Auth, Author, Ticket, Admin controllers
│       ├── middlewares/              # JWT auth guard, RBAC, centralized error handler
│       ├── routes/                   # Clean REST endpoints
│       ├── services/aiService.js     # Groq LLM integration & heuristic fallbacks
│       ├── knowledge/                # BookLeaf Knowledge Base & tone guidelines
│       └── socket/socketHandler.js   # Real-time WebSocket room dispatcher
│
└── client/                           # Frontend Application (React + Vite + Tailwind)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                   # Role-guarded routing
        ├── index.css                 # Custom scrollbar, glassmorphism, design tokens
        ├── api/axiosClient.js        # Axios instance with JWT interceptor
        ├── context/                  # AuthContext and SocketContext
        ├── components/common/        # Navbar, ProtectedRoute, StatusBadge
        └── pages/
            ├── Login.jsx             # Dual-role login with 1-click demo buttons
            ├── author/               # Author Dashboard, MyBooks, CreateTicket, Tickets
            └── admin/                # Operations Queue, TicketDetail (AI Draft Editor)
```

---

## 🔒 Security Highlights

- **Data Isolation:** Authors can only query and view books and tickets matching their `authorId`.
- **Private Internal Notes:** Filtered out in the database query and stripped at controller level before response reaches any author.
- **Human Review Safeguard:** AI drafts are never sent automatically to authors. They require explicit human admin review, editing, and approval.
- **Environment Confidentiality:** All API secrets (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`) reside exclusively in backend environment variables and are excluded from Git.
- **Rate Limiting & Security Headers:** Integrated `helmet` security headers and `express-rate-limit` protecting `/api/auth/login` and general `/api` routes.

---

## 🌐 Production Deployment Guide

### 1. Database (Neon.tech or Supabase - 100% Free PostgreSQL)
1. Create a free PostgreSQL database at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the connection string with pooling/SSL:
   `postgresql://username:password@ep-host.neon.tech/neondb?sslmode=require`

### 2. Backend Deployment (Render or Railway)
1. Create a **New Web Service** connected to your repository.
2. Root Directory: `server`
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `npm start`
5. Add Environment Variables in Render:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `DATABASE_URL`: *(Your hosted Postgres URI)*
   - `JWT_SECRET`: *(A strong random 64-character string)*
   - `JWT_EXPIRES_IN`: `7d`
   - `GROQ_API_KEY`: *(Your Groq API key)*
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
6. Run database seed once via Render SSH or one-off job:
   `npx prisma db push && node prisma/seed.js`

### 3. Frontend Deployment (Vercel)
1. Import repository in [Vercel](https://vercel.com).
2. Root Directory: `client`
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variables in Vercel:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
7. Click **Deploy**!
