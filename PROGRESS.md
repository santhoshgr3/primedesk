# Build Progress

Implementation status against [PLAN.md](PLAN.md). **All 11 modules built + extensions + hardening.**

## 🔒 Hardening & production-readiness

| Area | What changed |
|------|--------------|
| **RBAC** | `withAuth(roles[])` enforces role on ~25 mutating routes (403); every request re-checks the user is still active (deactivated JWTs rejected, role changes picked up). |
| **Confidentiality** | Operator commission rate stripped from API + UI for non ADMIN/OPS (`lib/serializers.ts`). |
| **Webhooks** | Meta `X-Hub-Signature-256` HMAC verification on whatsapp + meta-leads (skipped only when `META_APP_SECRET` unset). |
| **Rate limiting** | Fixed-window limiter (`lib/rate-limit.ts`, Redis-ready) on webhooks, public shortlist endpoints, global search. |
| **Share links** | 30-day expiry + revoke (`DELETE /api/shortlists/:id/share`); public page shows a friendly message when expired/revoked. |
| **Env** | Validated at boot (`lib/env.ts`) — missing `AUTH_SECRET`/`DATABASE_URL` fails fast. |
| **Seed guard** | Refuses to wipe a populated DB unless `ALLOW_SEED=1` (`npm run db:seed:force`). |
| **Optimistic locking** | `Deal.version` + `expectedVersion` on PATCH → 409 on concurrent edits. |
| **Perf** | advisor/operator reports rewritten from N+1 to 3–5 grouped queries; TTL cache (`lib/cache.ts`) on dashboard (20s) + reports (60s); hot-path indexes on Activity/Message/Visit/Deal/Shortlist/Task; `Enquiry.seatsMin/Max` for numeric seat filtering + a DB prefilter in match. |
| **Observability** | `lib/observability.ts` — optional Sentry capture (`SENTRY_DSN`) wired into the API error handler. |
| **CI** | GitHub Actions: prisma validate + typecheck + **lint (re-enabled)** + build, plus a Postgres-backed vitest job. |
| **Tests** | 17 vitest units — scoring, commission, CSV, template render, formatting, webhook signature, rate limiter. |

## 🔌 Integrations & jobs (now real)

- **WhatsApp** — live Meta Cloud API sends (text + approved-template) when `WHATSAPP_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` set; logged no-op otherwise.
- **Email** — live Resend sends when `RESEND_API_KEY` set; shortlist email = branded HTML + PDF attachment, reply-to advisor.
- **PDF** — real PDF via pdfkit (`?format=html` keeps the print view; falls back to HTML if rendering throws).
- **Cron** — `vercel.json` crons for reminders/escalate/digest/rescore; `npm run dev:cron` runs the same schedule locally.

## 🧩 More features

| Feature | What it does |
|---------|--------------|
| **Notification center** | Bell dropdown (unread badge, 30s poll, mark-read). Fires on: enquiry assigned, new inbound lead, client shortlist response, task escalation, deal won. |
| **CSV import** | `/api/enquiries/import` — header aliasing, phone-dedup, per-row errors, downloadable template; Import dialog on the enquiries page. |
| **Space detail + compare** | `/spaces/[id]` (pricing breakdown, inclusions, performance stats, "verify now"); `/spaces/compare?ids=` side-by-side for 2–3 spaces. |
| **Calendar** | `/api/visits/[id]/ics` + "Add to calendar" link. |
| **Deal documents** | Local-disk upload (`lib/storage.ts`, 10 MB, typed), auth-gated download/delete, widget in the deal dialog. |
| **Mobile + dark mode** | Slide-over nav drawer + hamburger; next-themes toggle; command palette (⌘K). |
| **Role-aware dashboard** | Advisors lead with "Your tasks today" + "Your top open enquiries" (score-ranked). |
| **Pagination / confirm dialogs / inline naming** | Real `<Pagination>` on enquiries; `useConfirm()` replaces native `confirm()`; saved-view naming is an inline field; visits page uses query invalidation, not `location.reload()`. |

## ✨ Extensions (beyond the plan)

| Feature | What it does |
|---------|--------------|
| **Public client shortlist link** | `POST /api/shortlists/:id/share` mints a token → `/s/<token>` is a branded, no-login page where the client ticks the spaces they like and requests a visit. Submitting writes `clientPreferred` on the items, sets the shortlist response, logs the client's words on the enquiry timeline, and auto-creates a HIGH task for the advisor. Advisor UI shows "client picked" badges + when the link was opened. |
| **Lead scoring engine** | `lib/services/scoring.ts` — 0–100 score from seats + move-in timeline + budget + source + engagement (touchpoints, shortlist/visit progress, recency decay) → drives Hot/Warm/Cold. Runs on create, on every status change, on demand ("Rescore" on the enquiry, shows the point breakdown), and nightly via `POST /api/cron/rescore`. |
| **Global search** | Topbar search is now live — `GET /api/search?q=` across enquiries, operators and spaces with a grouped dropdown. |
| **Duplicate detection** | New-enquiry form checks phone (last-10 digits) + company name on blur (`GET /api/enquiries/check-duplicate`) and shows matching enquiries inline before you create a dupe. |
| **Saved filter views** | Enquiries page has preset chips (New / Unassigned / My enquiries / Hot leads / Awaiting response / In negotiation) plus "Save view" for custom filter combos (localStorage). |
| **Full-field quick create** | `POST /api/enquiries` now persists industry, size, micro-market, budget, timeline, amenities & notes (previously dropped by the quick schema). |

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

## API surface (~65 routes)

Enquiries (CRUD, assign, status, timeline, bulk, export, **import**, **check-duplicate**, **rescore**) ·
Operators · Spaces (+ `/search` match) · Shortlists (+ send, response, pdf, **share/revoke**) ·
**Public** `/api/public/shortlist/[token]` · Visits (+ outcome, **ics**) · Deals (+ stage, **documents**) ·
Documents · Tasks · Messages (+ templates, bulk) · Calls · **Search** · **Notifications** · Reports ·
Settings · Targets · Team · Audit · Webhooks (whatsapp, meta-leads, website-form) ·
Cron (reminders, escalate, digest, **rescore**)

## Deliberately deferred (noted, not done)

- **Money as integer paise / Decimal** — Float is fine for INR sums well under 2^53; conversion is invasive with low ROI now.
- **`Activity.performedBy` → FK** — left as a string id (rows include `"system"`); needs a backfill migration.
- **Table column sorting** and **inline Zod field errors** on every form — lists paginate + filter; forms surface a summary error.
- **Full `@sentry/nextjs` build integration** — replaced with a lightweight capture hook.

## Verified in this workspace

- `npm run build` → ✅ 53 routes, **lint enforced**
- `npx tsc --noEmit` → ✅ clean
- `npm test` → ✅ 17 vitest units
- `npx prisma validate` / `generate` → ✅
- Runtime smoke: RBAC 403s, commission stripping, webhook signature, deal 409 on stale version, notifications on assign, CSV import + dedup, document upload/download/delete, real PDF (`%PDF-1.3`), .ics export — all ✅
- **Full runtime, end-to-end** → ✅ verified on an embedded Postgres AND on the project's **Supabase** database (`db.sjubclexvksjnsrpitjn.supabase.co`): `prisma migrate deploy` + `npm run db:seed` + `npm run dev`, logged in as admin, every page 200, reports/match/pipeline/webhook APIs returning real data, no errors in the dev log

## Running it

```bash
npm install

# Option A — Docker
docker compose up -d                 # Postgres + Redis

# Option B — no Docker (embedded Postgres, what was used here)
npm run db:local                     # starts Postgres on :5432, leave running in its own terminal

npx prisma migrate deploy            # applies all migrations
npm run db:seed                      # (empty DB) or: npm run db:seed:force
npm run dev                          # http://localhost:3000
npm run dev:cron                     # optional: fires the scheduled jobs locally
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
