import { prisma } from "@/lib/prisma";
import type { Enquiry } from "@prisma/client";

export type ScoreBreakdown = { label: string; points: number }[];

const SEAT_POINTS: Record<string, number> = {
  "200+": 30,
  "100-200": 22,
  "50-100": 15,
  "20-50": 8,
};

const TIMELINE_POINTS: Record<string, number> = {
  immediate: 25,
  "1_month": 18,
  "3_months": 10,
  "6_months": 4,
  exploring: 0,
};

const SOURCE_POINTS: Record<string, number> = {
  REFERRAL: 8,
  DIRECT_CALL: 8,
  WEBSITE_FORM: 5,
  WHATSAPP_INBOUND: 5,
  LINKEDIN: 4,
  GOOGLE_ADS: 3,
  FACEBOOK_ADS: 2,
  INSTAGRAM_ADS: 2,
  COLD_CALL: 1,
  WALK_IN: 4,
  OTHER: 0,
};

type Signals = {
  shortlistsSent: number;
  visitsDone: number;
  activityCount: number;
  daysSinceLastActivity: number | null;
};

/**
 * Lead score 0–100 from requirement fit + engagement (PLAN Module 1 —
 * "Score / Priority flag based on seats, timeline, engagement").
 */
export function computeScore(
  enquiry: Pick<
    Enquiry,
    | "seatsNeeded"
    | "moveInTimeline"
    | "budgetPerSeat"
    | "source"
    | "contactEmail"
    | "status"
  >,
  s: Signals,
): { score: number; priority: "hot" | "warm" | "cold"; breakdown: ScoreBreakdown } {
  const b: ScoreBreakdown = [];
  const add = (label: string, points: number) => {
    if (points) b.push({ label, points });
  };

  add(`Seats: ${enquiry.seatsNeeded}`, SEAT_POINTS[enquiry.seatsNeeded] ?? 0);
  add(
    `Timeline: ${enquiry.moveInTimeline ?? "unknown"}`,
    enquiry.moveInTimeline ? TIMELINE_POINTS[enquiry.moveInTimeline] ?? 0 : 0,
  );
  add("Budget provided", enquiry.budgetPerSeat ? 8 : 0);
  add(`Source: ${enquiry.source}`, SOURCE_POINTS[enquiry.source] ?? 0);
  add("Email on file", enquiry.contactEmail ? 3 : 0);

  add("Shortlist sent", Math.min(s.shortlistsSent, 2) * 6);
  add("Visit completed", Math.min(s.visitsDone, 2) * 9);
  add("Engagement (touchpoints)", Math.min(s.activityCount, 6) * 2);

  if (s.daysSinceLastActivity != null) {
    if (s.daysSinceLastActivity <= 2) add("Active in last 48h", 8);
    else if (s.daysSinceLastActivity <= 7) add("Active this week", 3);
    else if (s.daysSinceLastActivity >= 21) add("Gone quiet 3+ weeks", -10);
  }

  if (enquiry.status === "NEGOTIATION") add("In negotiation", 10);
  if (enquiry.status === "PAUSED") add("Paused", -15);

  const raw = b.reduce((sum, x) => sum + x.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  const priority = score >= 65 ? "hot" : score >= 35 ? "warm" : "cold";
  return { score, priority, breakdown: b };
}

export async function scoreEnquiry(enquiryId: string) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      _count: { select: { activities: true } },
      shortlists: { where: { sentAt: { not: null } }, select: { id: true } },
      visits: { where: { status: "done" }, select: { id: true } },
    },
  });
  if (!enquiry) return null;

  const daysSinceLastActivity = enquiry.lastActivityAt
    ? Math.floor(
        (Date.now() - new Date(enquiry.lastActivityAt).getTime()) / 86400000,
      )
    : null;

  const { score, priority, breakdown } = computeScore(enquiry, {
    shortlistsSent: enquiry.shortlists.length,
    visitsDone: enquiry.visits.length,
    activityCount: enquiry._count.activities,
    daysSinceLastActivity,
  });

  await prisma.enquiry.update({
    where: { id: enquiryId },
    data: { score, priority, scoredAt: new Date() },
  });

  return { score, priority, breakdown };
}
