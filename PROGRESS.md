# Build Progress

Implementation status against [PLAN.md](PLAN.md). **All 11 modules built.**

## ✅ Phase 1 — Foundation

Project scaffold (Next.js 14 App Router, TS, Tailwind, hand-rolled shadcn-style UI kit),
Docker Compose (Postgres + Redis), Dockerfile, full Prisma schema (24 models),
NextAuth v5 credentials + RBAC (`middleware.ts` + role matrix), dashboard shell
(sidebar with live badges, topbar), executive dashboard (6 live KPIs, recent enquiries,
city bars), seed data.

## ✅ Phase 2 — Core Advisory

| Module | What's built |
|--------|--------------|
| **2 · Operators & Spaces** | Operator directory + profile pages, contacts editor, space CRUD with 20+ fields, filters (city/type/seats/price), **availability dashboard** by micro-market, 30-day re-verification flag |
| **3 · Shortlist Builder** | **Smart match engine** (`lib/services/match.ts` — 0–100 fit score with reasons), builder UI (matched pane → select → reorder → per-space notes), branded **print-to-PDF** (`/api/shortlists/:id/pdf`), send via WhatsApp/email, response tracking, version history |
| **4 · Site Visits** | Weekly calendar view per advisor, schedule dialog from enquiry, auto reminder tasks (1-day + 2-hour), operator-contact field, outcome form → **auto-creates deal** when "interested", no-show → auto follow-up task |
| **5 · Deal Pipeline** | **Kanban board with drag-and-drop** (@dnd-kit) across 8 stages, stage-aging red flag, per-column pipeline value, deal editor (terms + **commission calc** + **co-broker split**), lost-reason capture, auto seat-decrement + enquiry-status sync on move-in |

## ✅ Phase 3 — Communication

- **Comms hub** (`/communications`) — thread list + per-enquiry conversation + composer with template picker
- WhatsApp send (`lib/whatsapp.ts` — noop without token, real code path), inbound webhook → timeline
- Email stub (`lib/email.ts` — Resend), call logging (`/api/calls` + log-call dialog)
- **Message template library** — editor + approval flag in Settings
- **Bulk WhatsApp** to a filtered enquiry list
- Every send/call lands on the activity timeline

## ✅ Phase 4 — Automation & Integrations

- **Auto-assignment** (`lib/services/assignment.ts`) — manual / round-robin / city-based routing, configurable
- `createInboundEnquiry` — welcome WhatsApp + SLA task + auto-assign, idempotent on Meta lead id
- Webhooks: **Meta Lead Ads** (`/api/webhooks/meta-leads`), **website form** (`/api/webhooks/website-form`), WhatsApp
- **Cron endpoints** (bearer / Vercel-cron guarded): `/api/cron/reminders` (visit reminders), `/api/cron/escalate` (48h overdue → manager), `/api/cron/digest` (9 AM per-advisor email)
- Advisor deactivation auto-reassigns their open enquiries

## ✅ Phase 5 — Analytics

`/reports` with 8 tabs + Recharts: **Lead Sources** (enquiries vs wins vs commission),
**Advisor performance** (response, shortlist, conversion, revenue), **Funnel** (reached / drop-off from status history),
**Pipeline** value by stage, **Operator performance**, **Revenue** (pending/invoiced/received by month + YTD),
**Workspace demand** (type + seat range), **Lost-deal analysis** by reason.
All served by `lib/services/reports.ts` → `/api/reports?report=<name>`.

## ✅ Phase 6 — Polish & Config

- **Settings** (`/settings`) — branding, assignment mode, SLA thresholds, working hours, **template editor**, **audit log** viewer. Persisted to `Setting` table via `/api/settings`.
- **Team** — add/deactivate members, role assignment, **monthly targets + leaderboard** (goal vs actual)
- **Bulk actions** on enquiries (assign / priority / archive) + **CSV export**
- PWA manifest + icon, audit logging on settings/template/bulk/team changes

## API surface (46 routes)

Enquiries (CRUD, assign, status, timeline, bulk, export) · Operators · Spaces (+ `/search` match) ·
Shortlists (+ send, response, pdf) · Visits (+ outcome) · Deals (+ stage) · Tasks (+ complete) ·
Messages (+ templates, bulk) · Calls · Reports · Settings · Targets · Team · Audit ·
Webhooks (whatsapp, meta-leads, website-form) · Cron (reminders, escalate, digest)

## Verified in this workspace

- `npm run build` → ✅ 46 routes compiled
- `npx tsc --noEmit` → ✅ clean
- `npx prisma validate` / `generate` → ✅
- **Full runtime, end-to-end** → ✅ verified on an embedded Postgres AND on the project's **Supabase** database (`db.sjubclexvksjnsrpitjn.supabase.co`): `prisma migrate deploy` + `npm run db:seed` + `npm run dev`, logged in as admin, every page 200, reports/match/pipeline/webhook APIs returning real data, no errors in the dev log

## Running it

```bash
npm install

# Option A — Docker
docker compose up -d                 # Postgres + Redis

# Option B — no Docker (embedded Postgres, what was used here)
npm run db:local                     # starts Postgres on :5432, leave running in its own terminal

npx prisma migrate deploy            # applies prisma/migrations/0_init
npm run db:seed
npm run dev                          # http://localhost:3000
```

Or point `DATABASE_URL` in `.env` at a Neon/Supabase database instead.

Login: `admin@primedesk.co.in` / `Admin@123`
Other seeded logins (same password): `ops@`, `arjun@`, `kavya@`, `rohit@`, `neha@primedesk.co.in`

### Cron (production)

Point a scheduler at these with `Authorization: Bearer $CRON_SECRET`:
`POST /api/cron/reminders` (*/15 min) · `POST /api/cron/escalate` (hourly) · `POST /api/cron/digest` (daily 09:00)

### Integration test helpers

```bash
# Simulate a website enquiry (auto-assign + welcome + SLA task)
curl -X POST localhost:3000/api/webhooks/website-form -H 'content-type: application/json' \
  -d '{"companyName":"Acme","contactName":"Riya","contactPhone":"+919000000000","seatsNeeded":"50-100","city":"Hyderabad"}'
```
