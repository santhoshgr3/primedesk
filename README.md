# 🏢 PrimeDesk CRM — Office Space Advisory Platform

> A purpose-built CRM for PrimeDesk's workspace advisory business — managing company enquiries, operator inventory, shortlists, site visits, and lease pipelines across Hyderabad, Bangalore, Chennai & Delhi.

---

## 📌 What This CRM Does

PrimeDesk is a **B2B commercial office space aggregator** — not a residential broker. Their clients are **companies** (startups, SMEs, IT firms, GCCs) looking for managed offices, co-working spaces, or enterprise floors. Their revenue comes from **workspace operators** (landlords/providers), not from clients (zero brokerage to clients).

This CRM is built around their actual workflow:

```
Company Enquiry → Workspace Advisor Assigned → Requirement Call →
Curated Shortlist Sent → Site Visits Coordinated →
Negotiation → Lease Closed → Operator Commission Logged
```

---

## 🎯 Who Uses This CRM

| Role | Responsibilities |
|------|-----------------|
| **Admin** | Full access — team, reports, operator relationships, billing |
| **Workspace Advisor** | Owns client enquiries end-to-end, sends shortlists, coordinates visits |
| **Operations Manager** | Manages operator inventory, verifies listings, coordinates move-ins |
| **Marketing / Lead Manager** | Monitors inbound leads, source tracking, campaign performance |

---

## ⚡ Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (server state)
- **React Hook Form** + **Zod** (forms & validation)
- **@dnd-kit** (Kanban drag-and-drop)
- **Recharts** (analytics)
- **React Big Calendar** (visit scheduling)

### Backend
- **Next.js API Routes** (REST API)
- **Prisma ORM** + **PostgreSQL**
- **Redis** (caching, sessions, queues)
- **BullMQ** (background jobs — reminders, WhatsApp, email)
- **NextAuth.js v5** (authentication + RBAC)

### Infrastructure
- **Docker + Docker Compose** (local dev)
- **Vercel** or **Railway** (deployment)
- **Neon / Supabase** (managed PostgreSQL)
- **Cloudflare R2** (document/brochure storage)

### Key Integrations
- **WhatsApp Business API** (Meta Cloud / WATI) — primary client communication
- **Resend** (email — shortlists, confirmations, follow-ups)
- **Google Calendar API** (site visit sync with advisor calendars)
- **Meta Leads API** (Facebook/Instagram lead forms → auto-import)
- **Twilio** (call logging)
- **Razorpay** (optional — future: operator commission invoicing)

---

## 🗂️ Project Structure

```
primedesk-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + topbar shell
│   │   ├── page.tsx                # Executive dashboard
│   │   ├── enquiries/              # Company enquiry management
│   │   ├── operators/              # Operator & space inventory
│   │   ├── shortlists/             # Curated shortlist builder
│   │   ├── pipeline/               # Deal/lease Kanban pipeline
│   │   ├── visits/                 # Site visit scheduler & tracker
│   │   ├── tasks/                  # Follow-up tasks & reminders
│   │   ├── communications/         # WhatsApp, email, call logs
│   │   ├── reports/                # Analytics & reports
│   │   ├── team/                   # Advisors & team management
│   │   └── settings/               # System settings
│   └── api/
│       ├── auth/
│       ├── enquiries/
│       ├── operators/
│       ├── spaces/
│       ├── shortlists/
│       ├── pipeline/
│       ├── visits/
│       ├── tasks/
│       ├── communications/
│       ├── reports/
│       └── webhooks/               # WhatsApp, Meta Leads, Google Calendar
├── components/
│   ├── ui/                         # shadcn base components
│   ├── layout/                     # Sidebar, Topbar, Breadcrumbs
│   ├── enquiries/                  # Enquiry cards, timeline, requirement form
│   ├── operators/                  # Operator card, space listing grid
│   ├── shortlists/                 # Shortlist builder, PDF preview
│   ├── pipeline/                   # Kanban board, deal card
│   ├── visits/                     # Calendar view, visit outcome form
│   └── charts/                     # Dashboard widgets
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── redis.ts
│   ├── queue.ts
│   ├── storage.ts
│   ├── whatsapp.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── hooks/
├── types/
├── config/
├── middleware.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Setup
```bash
# 1. Clone
git clone https://github.com/laadhyatech/primedesk-crm.git
cd primedesk-crm

# 2. Install
npm install

# 3. Start local DB + Redis
docker-compose up -d

# 4. Environment
cp .env.example .env.local
# → Fill in values (see below)

# 5. Database setup
npx prisma migrate dev --name init
npx prisma db seed

# 6. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
Default admin: `admin@primedesk.co.in` / `Admin@123` (from seed)

---

## 🔐 Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PrimeDesk CRM
NEXT_PUBLIC_COMPANY_PHONE=+917993726302
NEXT_PUBLIC_COMPANY_EMAIL=info@primedesk.co.in

# Database
DATABASE_URL=postgresql://primedesk:password@localhost:5432/primedesk_crm

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-min-32-char-secret

# Storage (Cloudflare R2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=primedesk-crm
R2_PUBLIC_URL=

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@primedesk.co.in

# WhatsApp Business API
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Meta Leads API
META_APP_ID=
META_APP_SECRET=
META_WEBHOOK_VERIFY_TOKEN=

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Twilio (optional call logging)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 🐳 Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: primedesk_crm
      POSTGRES_USER: primedesk
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 🧪 Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force && npm run db:seed",
    "format": "prettier --write ."
  }
}
```

---

## 🗺️ Roadmap

### Phase 1 — Core (Weeks 1–3)
- [x] Auth + role-based access (Admin / Advisor / Ops)
- [x] Dashboard shell (sidebar, topbar, mobile responsive)
- [x] Enquiry management (CRUD, list, filters, timeline)
- [x] Task & follow-up system

### Phase 2 — Inventory & Shortlists (Weeks 4–6)
- [x] Operator management (profiles, contacts, commission rates)
- [x] Space/inventory listings (city, micro-market, type, pricing)
- [x] Shortlist builder (match enquiry → spaces → PDF/WhatsApp)
- [x] Site visit scheduler + calendar view

### Phase 3 — Pipeline & Communication (Weeks 7–9)
- [x] Lease/deal Kanban pipeline
- [x] WhatsApp Business API (send templates, view threads)
- [x] Email integration (shortlist delivery, follow-ups)
- [x] Call logging

### Phase 4 — Automation & Integrations (Weeks 10–12)
- [x] Meta Leads API (Facebook/Instagram form sync)
- [x] Google Calendar sync (advisor visits)
- [x] WhatsApp bot (auto-qualify inbound messages)
- [x] Auto follow-up sequences

### Phase 5 — Analytics (Weeks 13–14)
- [x] Executive dashboard (KPIs, funnels, city-wise breakdown)
- [x] Advisor performance reports
- [x] Lead source ROI report
- [x] Commission & revenue tracking

---

## 📄 License

MIT — © 2026 Laadhya Tech Solutions | Built for PrimeDesk
