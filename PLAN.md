# 🏗️ PrimeDesk CRM — Full Product Plan

> CRM built specifically for PrimeDesk's B2B office space aggregation business.
> This is NOT a residential real estate CRM — it's built around commercial workspace advisory.

---

## 1. 🎯 Business Context

### What PrimeDesk Does
PrimeDesk is India's office space aggregator. They connect **companies** (their clients) with **workspace operators** (their supply partners) across Hyderabad, Bangalore, Chennai, and Delhi. They charge **zero brokerage to clients** — revenue comes from operators as a referral/commission when a deal closes.

### The Advisory Process (6 Steps)
```
1. Company submits enquiry (website / WhatsApp / call)
2. Workspace advisor calls within 2 hours — qualifies requirement
3. Advisor curates shortlist (3–5 verified spaces matching criteria)
4. Advisor sends shortlist via WhatsApp/email — client shortlists 1–2
5. Site visits coordinated (advisor + client + operator)
6. Advisor negotiates terms, supports documentation, confirms move-in
   └─ PrimeDesk earns commission from operator
```

### Why They Need a CRM
- Enquiries come from 5+ channels (website, WhatsApp, LinkedIn, Ads, referrals)
- No structured way to track which advisor is handling which company
- No shortlist history — advisors rebuild shortlists from memory each time
- No follow-up tracking — hot leads go cold without a system
- No analytics — can't tell which city, workspace type, or source converts best
- Operator inventory lives in WhatsApp groups and spreadsheets

---

## 2. 👤 Key Personas

### Workspace Advisor (primary CRM user)
- Handles 20–40 active enquiries at a time
- Primary communication: WhatsApp + phone calls
- Pain: Forgetting to follow up, losing track of which shortlist was sent to whom
- Needs: Task reminders, quick shortlist builder, WhatsApp send from CRM

### Operations Manager
- Manages operator relationships, verifies space availability
- Updates inventory when spaces get booked or become available
- Needs: Operator directory, space inventory management, visit coordination

### Admin / Business Owner
- Needs visibility: which advisors are active, which cities are performing, monthly revenue
- Needs: Dashboard KPIs, advisor performance, commission reports

---

## 3. 📦 Modules

---

### MODULE 1: Enquiry Management (Core)

This is the heart of the CRM. An "Enquiry" is a company that has expressed interest in finding office space.

#### Fields on an Enquiry
```
Company Information:
- Company name
- Industry (IT / Fintech / Startup / GCC / Consulting / Healthcare / Other)
- Company size (overall headcount)

Contact Person (Decision Maker):
- Full name
- Designation (CEO / HR Head / Admin / CTO / Office Manager)
- Phone (WhatsApp-enabled)
- Email

Workspace Requirement:
- Number of seats needed (20–50 / 50–100 / 100–200 / 200+)
- City (Hyderabad / Bangalore / Chennai / Delhi)
- Micro-market preference (HITEC City / Gachibowli / Financial District / Madhapur / Kondapur / Other)
- Workspace type (Managed Office / Co-working / Plug & Play / Customized / GCC / Not sure)
- Budget per seat/month (₹ range)
- Move-in timeline (Immediate / 1 month / 3 months / 6 months / Exploring)
- Amenities priorities (parking, 24/7 access, IT infra, cafeteria, meeting rooms, etc.)
- Other notes / special requirements

Meta:
- Lead source (Website / WhatsApp / LinkedIn / Facebook Ads / Google Ads / Referral / Walk-in / Cold Call)
- Enquiry date
- Assigned advisor
- Status (see status flow below)
```

#### Enquiry Status Flow
```
NEW → ADVISOR_ASSIGNED → REQUIREMENT_CALL_DONE →
SHORTLIST_SENT → VISIT_SCHEDULED → VISIT_DONE →
NEGOTIATION → CLOSED_WON → CLOSED_LOST / PAUSED
```

#### Features
- **Quick-add form** — minimal fields (phone, seats, city, type) to capture fast inbound
- **Full requirement form** — filled post requirement call
- **Enquiry timeline** — every action logged chronologically (call, WhatsApp, shortlist sent, visit done)
- **Smart filters** — by city, workspace type, seats, status, advisor, date range, source
- **Saved filter views** — "My Active Enquiries", "Shortlist Sent — Awaiting Response", "Overdue Follow-ups"
- **Bulk actions** — assign advisor, tag, export CSV
- **Duplicate detection** — by phone number / company name
- **Score / Priority flag** — Hot / Warm / Cold (based on seats, timeline, engagement)

#### Database
```
enquiries, enquiry_contacts, enquiry_requirements, enquiry_status_history,
enquiry_tags, enquiry_tag_assignments, enquiry_sources
```

---

### MODULE 2: Operator & Space Inventory

Operators are PrimeDesk's supply side — the workspace providers they partner with.

#### Operator Profile
```
- Operator name (e.g. Awfis, WeWork, IndiQube, Smartworks, 91springboard, independent)
- Type (National chain / Regional / Independent landlord)
- Primary contact name, phone, email, WhatsApp
- Cities of operation
- Commission rate (% — confidential, not shown to clients)
- Relationship manager at PrimeDesk
- SLA: shortlist response time (hours)
- Notes / relationship history
```

#### Space/Property Listing (per operator)
```
- Space name / internal code
- Operator (linked)
- City + Micro-market (HITEC City, Gachibowli, etc.)
- Full address + Google Maps pin
- Space type (Managed Office / Co-working / Plug & Play / Customized / GCC Floor)
- Total capacity (seats)
- Available seats (updated regularly)
- Area (sqft)
- Pricing:
  - Per seat / month (₹)
  - Lock-in period (months)
  - Security deposit (months)
  - Included in price (internet, electricity, housekeeping, meeting room hours, etc.)
  - Add-on costs (parking, cabins, extra meeting rooms)
- Amenities (checklist)
- Floor + building name
- Move-in readiness (Ready / 2 weeks / 1 month)
- Space images (gallery upload)
- Brochure PDF
- Virtual tour link (if any)
- Status (Active / Waitlisted / Full / Inactive)
- Last verified date (when PrimeDesk last confirmed availability)
```

#### Features
- **Operator directory** — searchable list of all partners
- **Space search & filter** — by city, micro-market, type, seats, price range, move-in date
- **Availability dashboard** — seats available per micro-market at a glance
- **Space comparison view** — compare 2–3 spaces side by side
- **Operator contact history** — log all calls/emails with each operator
- **Verification reminders** — auto-reminder to re-verify availability every 30 days
- **Space performance** — how many times shortlisted, visited, booked

#### Database
```
operators, operator_contacts, spaces, space_images, space_amenities,
space_pricing, space_availability_log, operator_communications
```

---

### MODULE 3: Shortlist Builder

The most unique module for PrimeDesk — advisors curate 3–5 matching spaces per enquiry and send a branded shortlist to the client.

#### Shortlist Creation Flow
```
1. Advisor opens enquiry → clicks "Build Shortlist"
2. System shows spaces matching: city + workspace type + seats + price range
3. Advisor selects 3–5 spaces, adds notes per space
4. System generates branded PDF shortlist (PrimeDesk header, space details, images, advisor contact)
5. Advisor reviews → sends via WhatsApp or email from CRM
6. Client responds → advisor marks preferred spaces
```

#### Shortlist Record
```
- Enquiry linked
- Spaces included (3–5)
- Advisor notes per space
- Sent via (WhatsApp / Email / Both)
- Sent at timestamp
- Client response (Interested in X / Wants to visit / No response / Not suitable)
- Spaces shortlisted by client (preferred 1–2)
```

#### Features
- **Smart match** — filter spaces automatically based on enquiry requirements
- **Drag-to-rank** — advisor reorders spaces before sending
- **PDF generator** — branded PrimeDesk shortlist PDF (auto-generated)
- **WhatsApp send** — sends shortlist as message + PDF from within CRM
- **Email template** — one-click shortlist email with PDF attached
- **Shortlist history** — every shortlist ever sent to a client, with response tracking
- **Version control** — if advisor sends a revised shortlist, both versions saved

#### Database
```
shortlists, shortlist_spaces, shortlist_responses
```

---

### MODULE 4: Site Visit Management

After a shortlist, the client selects 1–2 spaces to visit physically.

#### Visit Record
```
- Enquiry + space linked
- Visit type (Physical / Virtual tour / Video call walkthrough)
- Scheduled date + time
- Participants (advisor name, client contact, operator contact)
- Status (Scheduled / Confirmed / Done / No-show / Rescheduled / Cancelled)
- Outcome (Interested / Not interested / Needs another option / Revisit)
- Feedback (what the client liked / didn't like)
- Next step (follow up call / send alternative / start negotiation)
```

#### Features
- **Visit calendar** — weekly view per advisor; filter by city, operator, status
- **Auto WhatsApp reminder** to client (1 day before + 2 hours before)
- **Operator notification** — WhatsApp/email to operator confirming visit
- **Google Calendar sync** — add visit to advisor's Google Calendar
- **Visit outcome form** — quick form to record result right after visit
- **No-show handling** — auto-create follow-up task to reschedule
- **Multi-space visit day** — group 2–3 spaces in one visit itinerary (common for clients)
- **Visit reports** — visits per advisor, per city, per operator; visit → deal conversion rate

#### Database
```
visits, visit_participants, visit_outcomes, visit_reminders
```

---

### MODULE 5: Deal / Lease Pipeline (Kanban)

Once a client is interested in a space, a deal is opened and tracked through to closure.

#### Deal Stages (customizable)
```
REQUIREMENT_QUALIFIED → SHORTLIST_ACCEPTED → VISIT_DONE →
NEGOTIATING_TERMS → DOCUMENTATION → LEASE_SIGNED → MOVED_IN → LOST
```

#### Deal Record
```
- Enquiry linked (1 deal per enquiry per space)
- Space/operator linked
- Advisor owner
- Current stage
- Commercial terms:
  - Agreed price per seat/month (₹)
  - Number of seats
  - Total monthly value (₹)
  - Lock-in period (months)
  - Security deposit paid (₹)
  - Start date / Move-in date
- Commission:
  - Rate (from operator)
  - Expected value (₹)
  - Status (Pending / Invoiced / Received)
- Documents attached (LOI, lease agreement, company KYC)
- Notes / negotiation history
- Closed reason (if lost: price / location / requirement changed / went direct / competitor)
```

#### Features
- **Kanban board** — drag deal cards across stages
- **Deal card** shows: company name, seats, city, space name, deal value, days in stage
- **Stage aging** — red indicator if deal stuck > X days in a stage
- **Pipeline value** — total ₹ value of all open deals by stage
- **Commission tracker** — pending vs. received commissions per month
- **Co-broker deals** — mark deals with external channel partners, split commission
- **Win/Loss analysis** — reason tagging on lost deals

#### Database
```
deals, deal_stages, deal_stage_history, deal_documents, deal_commissions
```

---

### MODULE 6: Task & Follow-Up Management

Every enquiry must always have a scheduled next action. If an enquiry has no open task — it's falling through the cracks.

#### Task Types
- 📞 Call (follow-up / requirement call / negotiation call)
- 💬 WhatsApp message (send shortlist / check interest / reminder)
- 📧 Email (send shortlist / follow-up)
- 🏗️ Site visit (coordinate + attend)
- 📄 Send document (LOI, lease draft, operator brochure)
- 🤝 Internal meeting (team review of stalled deals)

#### Features
- **Today's tasks** — advisor's task dashboard for the day
- **Overdue tasks** — red flag, auto-escalation to manager after 48 hrs overdue
- **Auto-task creation** — on enquiry status change, a task is auto-created (e.g., "Send shortlist within 24 hours")
- **Task outcome** — when completing: Connected / No answer / Interested / Not now / Lost
- **Reminder system** — push notification in-app + WhatsApp to advisor
- **Morning digest** — daily 9 AM email to each advisor listing their tasks for the day

#### Database
```
tasks, task_types, task_reminders, task_outcomes
```

---

### MODULE 7: Communication Hub

#### 7A. WhatsApp (Primary Channel)
- **Send WhatsApp messages** to clients directly from CRM
- **WhatsApp Template Library** (pre-approved by Meta):
  - `welcome_enquiry` — "Hi [Name], thanks for reaching out to PrimeDesk! Our workspace advisor will call you within 2 hours."
  - `shortlist_ready` — "Hi [Name], we've shortlisted [N] spaces matching your requirement. Check the PDF attached!"
  - `visit_confirmation` — "Your site visit is confirmed for [Date] at [Location]. Our advisor [Advisor Name] will meet you there."
  - `visit_reminder_1day` — "Reminder: Your office space visit is tomorrow at [Time]. Any questions? Call us at +91 7993726302"
  - `visit_reminder_2hr` — "Just 2 hours to your visit at [Space Name]! See you there."
  - `follow_up_after_visit` — "Hi [Name], hope you liked the spaces! Which one felt right? Happy to discuss pricing or arrange another visit."
  - `deal_congratulations` — "Congratulations! Your office at [Space Name] is confirmed. Welcome to your new workspace! 🎉"
  - `festive_greeting` — Diwali, New Year, etc.
- **Incoming messages** — WhatsApp replies visible inside enquiry timeline
- **Bulk WhatsApp** — send a template to a filtered list of enquiries (e.g., "All Hyderabad enquiries sent shortlist > 3 days ago, no response")
- **Conversation thread** — full chat view per enquiry

#### 7B. Email
- Send branded emails (shortlist PDF, follow-up, confirmation)
- Track opens & clicks
- Email templates matching WhatsApp templates above

#### 7C. Call Logging
- Manual call log: outcome + duration + notes
- Click-to-call integration (dial directly from enquiry page)
- Auto-log if Twilio is connected

#### 7D. Activity Timeline
- Every touchpoint (call, WhatsApp, email, visit, shortlist sent, deal update) logged on enquiry timeline
- Advisor can see full history in one view

#### Database
```
messages, message_templates, whatsapp_threads, call_logs, email_logs, activities
```

---

### MODULE 8: Analytics & Reports

#### Executive Dashboard (Real-Time KPIs)
```
┌─────────────────────────────────────────────────────┐
│  New Enquiries Today  │  Active Pipeline  │  Revenue │
│        12             │    ₹48L           │  ₹6.2L   │
├─────────────────────────────────────────────────────┤
│  Shortlists Sent      │  Visits This Week │  Deals   │
│  This Week: 28        │  14 scheduled     │  Closed  │
│                       │  9 completed      │  MTD: 4  │
└─────────────────────────────────────────────────────┘
```

#### City Performance Panel
- Enquiries by city (Hyderabad / Bangalore / Chennai / Delhi)
- Pipeline value by city
- Conversion rate by city
- Most requested micro-markets

#### Reports

**1. Lead Source Report**
- Which channel (Website / WhatsApp / LinkedIn / Meta Ads / Google Ads / Referral) brings the most enquiries AND the most closed deals
- Cost per lead vs. value per close by source

**2. Advisor Performance Report**
- Enquiries assigned vs. shortlists sent vs. visits done vs. deals closed (per advisor, per week/month)
- Average response time (enquiry assigned → first contact)
- Average shortlist time (requirement call → shortlist sent)

**3. Enquiry Funnel Report**
- Drop-off rate at each stage (how many go from NEW → SHORTLIST_SENT → VISIT_DONE → CLOSED)
- Average days in each stage

**4. Workspace Type Demand Report**
- What types are clients asking for most (Managed Office vs. Co-working vs. Plug & Play)
- Seat range distribution (most popular: 20–50 / 50–100 / 100–200 / 200+)

**5. Operator Performance Report**
- Which operators close most deals
- Which spaces are most shortlisted but not booked (supply-demand gap)
- Commission earned per operator

**6. Lost Deal Analysis**
- Why deals were lost (price / location / competitor / requirement changed / no response)
- Which stage deals are most commonly lost

**7. Revenue & Commission Report**
- Monthly commissions: pipeline vs. invoiced vs. received
- YTD revenue
- Top revenue advisors

---

### MODULE 9: Operator Relationship Management

Beyond just inventory, PrimeDesk's relationship with operators is strategic.

#### Features
- **Operator contact book** — all operators, their key contacts, WhatsApp numbers
- **Operator call log** — track all communications with operators
- **Commission agreement tracker** — commission rate agreed per operator (confidential)
- **Operator rating** — internal rating (responsiveness, flexibility, space quality)
- **Inventory update requests** — when availability changes, operator notifies PrimeDesk; logged in system
- **New operator onboarding** — checklist: signed agreement, space photos collected, pricing confirmed, listed in CRM

---

### MODULE 10: Team & User Management

#### Features
- Add/deactivate workspace advisors
- Role assignment (Admin / Advisor / Operations / Marketing)
- **Enquiry assignment rules:**
  - Manual assignment by admin/manager
  - Round-robin auto-assign (distribute enquiries equally across active advisors)
  - City-based routing (Hyderabad enquiries → Hyderabad advisors)
- **Monthly targets per advisor:**
  - Shortlists sent target
  - Visits done target
  - Deals closed target
  - Revenue target (₹)
- **Advisor availability** — mark as unavailable (out-of-office) → enquiries auto-reassign
- Team leaderboard (gamification for advisors)

---

### MODULE 11: Settings & Configuration

- Company branding (logo, colors used in shortlist PDFs)
- WhatsApp template editor + approval workflow
- Pipeline stage customization (rename/reorder stages)
- Lead source list customization
- Notification rules (who gets notified for what)
- Working hours (for auto-reply messaging)
- Audit logs (who changed what, when)
- Integrations management (connect/disconnect WhatsApp, Google Calendar, Meta, etc.)

---

## 4. 🗄️ Database Schema (Prisma)

```prisma
enum UserRole {
  ADMIN
  ADVISOR
  OPERATIONS
  MARKETING
}

enum EnquiryStatus {
  NEW
  ADVISOR_ASSIGNED
  REQUIREMENT_CALL_DONE
  SHORTLIST_SENT
  VISIT_SCHEDULED
  VISIT_DONE
  NEGOTIATION
  CLOSED_WON
  CLOSED_LOST
  PAUSED
}

enum WorkspaceType {
  MANAGED_OFFICE
  COWORKING
  PLUG_AND_PLAY
  CUSTOMIZED
  GCC_ENTERPRISE
  NOT_SURE
}

enum EnquirySource {
  WEBSITE_FORM
  WHATSAPP_INBOUND
  LINKEDIN
  FACEBOOK_ADS
  INSTAGRAM_ADS
  GOOGLE_ADS
  REFERRAL
  COLD_CALL
  DIRECT_CALL
  OTHER
}

enum DealStage {
  REQUIREMENT_QUALIFIED
  SHORTLIST_ACCEPTED
  VISIT_DONE
  NEGOTIATING_TERMS
  DOCUMENTATION
  LEASE_SIGNED
  MOVED_IN
  LOST
}

enum TaskType {
  CALL
  WHATSAPP
  EMAIL
  SITE_VISIT
  SEND_DOCUMENT
  INTERNAL_MEETING
  FOLLOW_UP
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  phone         String?
  passwordHash  String
  role          UserRole   @default(ADVISOR)
  city          String?    // Which city this advisor primarily covers
  isActive      Boolean    @default(true)
  profileImage  String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  enquiries     Enquiry[]  @relation("AssignedEnquiries")
  tasks         Task[]
  deals         Deal[]
  visits        Visit[]
  shortlists    Shortlist[]
}

model Enquiry {
  id              String         @id @default(cuid())
  // Company info
  companyName     String
  industry        String?
  companySize     Int?           // Total company headcount

  // Contact person
  contactName     String
  contactPhone    String
  contactEmail    String?
  contactDesig    String?        // CEO / HR Head / Admin / etc.

  // Requirement
  seatsNeeded     String         // "20-50" | "50-100" | "100-200" | "200+"
  city            String         // Hyderabad | Bangalore | Chennai | Delhi
  microMarket     String?        // HITEC City, Gachibowli, etc.
  workspaceType   WorkspaceType
  budgetPerSeat   Float?
  moveInTimeline  String?        // immediate | 1_month | 3_months | 6_months | exploring
  amenityPriority String[]       // parking, 24/7, IT_infra, cafeteria, etc.
  notes           String?

  // Meta
  source          EnquirySource
  status          EnquiryStatus  @default(NEW)
  priority        String         @default("warm") // hot | warm | cold
  assignedToId    String?
  assignedTo      User?          @relation("AssignedEnquiries", fields: [assignedToId], references: [id])
  isArchived      Boolean        @default(false)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  lastActivityAt  DateTime?

  shortlists      Shortlist[]
  visits          Visit[]
  deals           Deal[]
  tasks           Task[]
  activities      Activity[]
  messages        Message[]
}

model Operator {
  id              String   @id @default(cuid())
  name            String
  type            String   // national_chain | regional | independent
  website         String?
  commissionRate  Float?   // % — confidential
  rating          Int?     // 1–5 internal rating
  notes           String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())

  contacts        OperatorContact[]
  spaces          Space[]
  deals           Deal[]
}

model OperatorContact {
  id          String   @id @default(cuid())
  operatorId  String
  operator    Operator @relation(fields: [operatorId], references: [id])
  name        String
  designation String?
  phone       String
  email       String?
  isPrimary   Boolean  @default(false)
}

model Space {
  id              String        @id @default(cuid())
  operatorId      String
  operator        Operator      @relation(fields: [operatorId], references: [id])
  name            String
  city            String
  microMarket     String
  address         String
  latitude        Float?
  longitude       Float?
  workspaceType   WorkspaceType
  totalSeats      Int
  availableSeats  Int
  areaSqft        Float?
  floor           String?
  building        String?

  // Pricing
  pricePerSeat    Float          // ₹ per seat per month
  lockInMonths    Int?
  depositMonths   Int?
  includedItems   String[]       // internet, electricity, housekeeping, etc.
  addOnItems      String[]       // parking, extra meeting rooms, etc.

  // Media
  images          String[]
  brochureUrl     String?
  virtualTourUrl  String?

  // Status
  status          String        @default("active") // active | full | waitlisted | inactive
  moveInReady     String        @default("ready")  // ready | 2_weeks | 1_month
  lastVerifiedAt  DateTime?
  isActive        Boolean       @default(true)
  amenities       String[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  shortlistItems  ShortlistItem[]
  visits          Visit[]
  deals           Deal[]
}

model Shortlist {
  id           String          @id @default(cuid())
  enquiryId    String
  enquiry      Enquiry         @relation(fields: [enquiryId], references: [id])
  advisorId    String
  advisor      User            @relation(fields: [advisorId], references: [id])
  pdfUrl       String?
  sentVia      String[]        // ["whatsapp", "email"]
  sentAt       DateTime?
  response     String?         // interested_in_X | wants_visit | no_response | not_suitable
  clientNote   String?         // which spaces client preferred
  version      Int             @default(1) // for revised shortlists
  createdAt    DateTime        @default(now())

  items        ShortlistItem[]
}

model ShortlistItem {
  id           String    @id @default(cuid())
  shortlistId  String
  shortlist    Shortlist @relation(fields: [shortlistId], references: [id])
  spaceId      String
  space        Space     @relation(fields: [spaceId], references: [id])
  advisorNote  String?   // custom note for this client about this space
  rank         Int       // display order
}

model Visit {
  id              String   @id @default(cuid())
  enquiryId       String
  enquiry         Enquiry  @relation(fields: [enquiryId], references: [id])
  spaceId         String
  space           Space    @relation(fields: [spaceId], references: [id])
  advisorId       String
  advisor         User     @relation(fields: [advisorId], references: [id])
  operatorContact String?  // operator person joining the visit
  scheduledAt     DateTime
  type            String   @default("physical") // physical | virtual | video_walkthrough
  status          String   @default("scheduled") // scheduled | done | no_show | cancelled | rescheduled
  outcome         String?  // interested | not_interested | needs_another | revisit
  clientFeedback  String?
  nextStep        String?
  createdAt       DateTime @default(now())
}

model Deal {
  id             String     @id @default(cuid())
  enquiryId      String
  enquiry        Enquiry    @relation(fields: [enquiryId], references: [id])
  spaceId        String
  space          Space      @relation(fields: [spaceId], references: [id])
  operatorId     String
  operator       Operator   @relation(fields: [operatorId], references: [id])
  advisorId      String
  advisor        User       @relation(fields: [advisorId], references: [id])
  stage          DealStage  @default(REQUIREMENT_QUALIFIED)

  // Commercial terms
  seats          Int
  pricePerSeat   Float
  monthlyValue   Float      // seats × pricePerSeat
  lockInMonths   Int?
  depositPaid    Float?
  startDate      DateTime?

  // Commission
  commissionRate  Float?
  commissionValue Float?
  commissionStatus String  @default("pending") // pending | invoiced | received

  lostReason     String?
  notes          String?
  documents      Document[]
  stageHistory   DealStageHistory[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

model Task {
  id           String     @id @default(cuid())
  type         TaskType
  title        String
  description  String?
  priority     Priority   @default(MEDIUM)
  dueDate      DateTime
  enquiryId    String?
  enquiry      Enquiry?   @relation(fields: [enquiryId], references: [id])
  assignedToId String
  assignedTo   User       @relation(fields: [assignedToId], references: [id])
  status       String     @default("pending") // pending | done | cancelled
  outcome      String?    // connected | no_answer | interested | not_now | lost
  completedAt  DateTime?
  createdAt    DateTime   @default(now())
}

model Message {
  id          String   @id @default(cuid())
  enquiryId   String
  enquiry     Enquiry  @relation(fields: [enquiryId], references: [id])
  channel     String   // whatsapp | email | sms
  direction   String   // outbound | inbound
  content     String
  templateId  String?
  status      String   // sent | delivered | read | failed
  sentAt      DateTime @default(now())
  sentBy      String?  // advisor user id
}

model Activity {
  id          String   @id @default(cuid())
  enquiryId   String
  enquiry     Enquiry  @relation(fields: [enquiryId], references: [id])
  type        String   // call | whatsapp | email | shortlist_sent | visit_scheduled | deal_update | note | status_change
  description String
  outcome     String?
  performedBy String   // user id
  createdAt   DateTime @default(now())
}

model Document {
  id         String   @id @default(cuid())
  name       String
  type       String   // loi | lease_agreement | company_kyc | brochure | other
  url        String
  dealId     String?
  deal       Deal?    @relation(fields: [dealId], references: [id])
  uploadedBy String
  createdAt  DateTime @default(now())
}

model DealStageHistory {
  id        String    @id @default(cuid())
  dealId    String
  deal      Deal      @relation(fields: [dealId], references: [id])
  fromStage DealStage?
  toStage   DealStage
  changedBy String
  createdAt DateTime  @default(now())
}
```

---

## 5. 🔌 REST API Design

```
# Enquiries
GET    /api/enquiries                     → list with filters & pagination
POST   /api/enquiries                     → create
GET    /api/enquiries/:id                 → full profile
PATCH  /api/enquiries/:id                 → update fields
POST   /api/enquiries/:id/assign          → assign advisor
GET    /api/enquiries/:id/timeline        → activity timeline
GET    /api/enquiries/:id/shortlists      → all shortlists
GET    /api/enquiries/:id/tasks           → tasks
POST   /api/enquiries/import              → CSV bulk import

# Operators & Spaces
GET    /api/operators                     → list
POST   /api/operators                     → create
GET    /api/operators/:id                 → profile + spaces
GET    /api/spaces                        → search with filters
POST   /api/spaces                        → create
PATCH  /api/spaces/:id                    → update / change availability
GET    /api/spaces/search                 → match spaces to enquiry requirements

# Shortlists
POST   /api/shortlists                    → create shortlist
GET    /api/shortlists/:id                → get with spaces
POST   /api/shortlists/:id/send           → send via WhatsApp / email
PATCH  /api/shortlists/:id/response       → record client response
GET    /api/shortlists/:id/pdf            → generate/download PDF

# Visits
GET    /api/visits                        → list (calendar data)
POST   /api/visits                        → schedule
PATCH  /api/visits/:id                    → update
POST   /api/visits/:id/outcome            → record result

# Deals
GET    /api/deals                         → pipeline list
POST   /api/deals                         → create
PATCH  /api/deals/:id/stage               → move stage
PATCH  /api/deals/:id                     → update terms
GET    /api/deals/:id                     → full detail

# Tasks
GET    /api/tasks                         → today / overdue / upcoming
POST   /api/tasks
POST   /api/tasks/:id/complete            → mark done + outcome

# Communications
POST   /api/messages/whatsapp             → send WhatsApp
POST   /api/messages/email                → send email
GET    /api/messages/templates            → list templates
POST   /api/webhooks/whatsapp             → incoming messages
POST   /api/webhooks/meta-leads           → Facebook Lead Ads

# Reports
GET    /api/reports/dashboard             → KPI snapshot
GET    /api/reports/enquiries             → source & funnel breakdown
GET    /api/reports/advisors              → performance per advisor
GET    /api/reports/pipeline              → stage metrics
GET    /api/reports/operators             → operator performance
GET    /api/reports/revenue               → commissions & revenue
```

---

## 6. 🎨 UI Layout & Key Screens

### Sidebar Navigation
```
🏠  Dashboard
📋  Enquiries        (badge: new unassigned count)
🏢  Operators & Spaces
📄  Shortlists
🔄  Pipeline
📅  Site Visits
✅  Tasks            (badge: overdue count)
💬  Communications
📊  Reports
👥  Team
⚙️  Settings
```

### Enquiry List (Main List View)
```
[ Search... ] [ City ▼ ] [ Type ▼ ] [ Advisor ▼ ] [ Status ▼ ] [ + New Enquiry ]

┌──────────────────────────────────────────────────────────────────────────────┐
│ Company         │ Contact     │ Seats  │ City      │ Type     │ Status  │ Age │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔴 TechSpark    │ Rahul M     │ 50–100 │ Hyderabad │ Managed  │ NEW     │ 2h  │
│ 🟡 FinStream    │ Sneha R     │ 20–50  │ Bangalore │ CoWork   │ SHORTLIST│ 1d │
│ 🟢 MarketVista  │ Priya D     │ 100+   │ Hyderabad │ GCC      │ VISIT   │ 3d  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Shortlist Builder
```
Enquiry: TechSpark | 50 seats | HITEC City | Managed Office | ₹8,000/seat budget

Matched Spaces (8 results):               Selected (3):
┌────────────────────────────┐            ┌─────────────────────┐
│ IndiQube Alpha             │  ──────>   │ 1. IndiQube Alpha   │
│ HITEC City · 120 seats     │            │    ₹7,500/seat      │
│ ₹7,500/seat · Ready        │            ├─────────────────────┤
├────────────────────────────┤            │ 2. Awfis Madhapur   │
│ Awfis Madhapur             │  ──────>   │    ₹7,800/seat      │
│ 80 seats · Plug & Play     │            ├─────────────────────┤
├────────────────────────────┤            │ 3. Smartworks HITEC │
│ Smartworks HITEC City      │  ──────>   │    ₹8,000/seat      │
│ 200 seats · GCC-ready      │            └─────────────────────┘
└────────────────────────────┘
                                          [ Generate PDF ] [ Send WhatsApp ] [ Send Email ]
```

---

## 7. 🔄 Key Business Workflows

### Workflow 1: New Inbound Enquiry (Website Form)
```
Client submits form (city, seats, type, phone)
    → Webhook → POST /api/enquiries (status: NEW)
    → WhatsApp auto-reply: "Thanks! Our advisor will call within 2 hours." ← sent immediately
    → Task auto-created: "Call [Company] within 2 hours" → assigned to on-duty advisor
    → Push notification to advisor
    → Advisor calls → logs call → updates status to REQUIREMENT_CALL_DONE
    → Advisor fills full requirement on enquiry form
    → Advisor opens Shortlist Builder → selects 3–5 spaces → clicks Send
    → PDF generated → sent via WhatsApp to client
    → Status auto-updates to SHORTLIST_SENT
    → Task auto-created: "Follow up if no response in 24 hours"
```

### Workflow 2: Visit Coordination
```
Client says "I'd like to visit IndiQube Alpha and Awfis Madhapur"
    → Advisor clicks Schedule Visit on each space
    → Advisor picks date/time → system notifies operator contacts via WhatsApp
    → Client receives WhatsApp confirmation with address + advisor contact
    → Day before: auto-reminder to client
    → 2 hours before: second reminder
    → Post-visit: advisor records outcome in CRM
    → If Interested → Deal auto-created → enters pipeline
    → If Not suitable → advisor sends revised shortlist
```

### Workflow 3: Deal to Commission
```
Client interested in IndiQube Alpha
    → Advisor creates Deal (seats: 60, price: ₹7,500, lock-in: 12 months)
    → Monthly value: ₹4,50,000
    → Deal moves through: NEGOTIATING → DOCUMENTATION → LEASE_SIGNED → MOVED_IN
    → On MOVED_IN: commission calculator runs
    → Commission: operator rate (e.g. 8%) × first month value = ₹36,000
    → Commission status: PENDING → admin invoices operator → INVOICED → RECEIVED
    → Revenue logged in monthly report
```

---

## 8. 📅 Phase-wise Build Plan

### Phase 1 — Foundation (Weeks 1–3)
| Week | Build |
|------|-------|
| 1 | Project scaffold, auth, roles, dashboard shell |
| 2 | Enquiry module (CRUD, list, filters, timeline, task auto-creation) |
| 3 | Operator & Space inventory (CRUD, search, availability tracking) |

### Phase 2 — Core Advisory (Weeks 4–6)
| Week | Build |
|------|-------|
| 4 | Shortlist builder (space matching, PDF generation, send via WhatsApp/email) |
| 5 | Site visit scheduling, calendar view, WhatsApp reminders |
| 6 | Deal pipeline Kanban, stage transitions, commission tracker |

### Phase 3 — Communication (Weeks 7–9)
| Week | Build |
|------|-------|
| 7 | WhatsApp Business API (send templates, view threads in CRM) |
| 8 | Email integration, call logging, activity timeline |
| 9 | Task management, reminders, daily morning digest |

### Phase 4 — Automation (Weeks 10–11)
| Week | Build |
|------|-------|
| 10 | Meta Leads API (Facebook/Instagram auto-import) |
| 11 | Auto-assignment rules, follow-up sequences, operator notification bot |

### Phase 5 — Analytics (Weeks 12–13)
| Week | Build |
|------|-------|
| 12 | Executive dashboard, advisor performance, funnel report |
| 13 | Lead source report, operator report, commission/revenue report |

### Phase 6 — Polish (Week 14–15)
| Week | Build |
|------|-------|
| 14 | Mobile-responsive tuning, PWA, bulk actions, export |
| 15 | QA, performance optimization, onboarding seed data, production deploy |

---

## 9. 🔑 PrimeDesk-Specific Differentiators in the CRM

| Feature | Why It Matters for PrimeDesk |
|---------|------------------------------|
| **Shortlist Builder** | Their core value-add — no other generic CRM has this |
| **Operator Inventory** | They're an aggregator — the supply side must be in the CRM |
| **Seats-based requirement capture** | Commercial reality — companies think in seats, not BHK |
| **Zero-brokerage commission tracking** | Revenue is hidden (from operators) — must be tracked internally |
| **City + micro-market routing** | Multi-city ops with different advisors per geography |
| **WhatsApp as primary channel** | Indian B2B clients prefer WhatsApp; auto-templates essential |
| **24-hour response SLA tracking** | Their key brand promise — the CRM enforces it via task auto-creation |
| **GCC/Enterprise workspace type** | Specific to their enterprise clients; needs separate pipeline treatment |

---

*Built by Santhosh | Laadhya Tech Solutions*
*For: PrimeDesk | primedesk.co.in | info@primedesk.co.in | +91 7993726302*
*Version 2.0 — September 2026 — Revised after business analysis*
