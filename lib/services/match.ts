import { prisma } from "@/lib/prisma";
import type { Enquiry, Space } from "@prisma/client";
import { seatBounds } from "@/lib/seats";

export type ScoredSpace = Space & {
  operator: { id: string; name: string };
  matchScore: number;
  matchReasons: string[];
};

/**
 * Rank spaces against an enquiry's requirement (PLAN Module 3 "smart match").
 * Score 0–100; higher is a better fit.
 */
export async function matchSpaces(
  enquiry: Enquiry,
  opts: { limit?: number } = {},
): Promise<ScoredSpace[]> {
  const fallback = seatBounds(enquiry.seatsNeeded);
  const minSeat = enquiry.seatsMin ?? fallback.min;
  const maxSeat = enquiry.seatsMax ?? fallback.max;
  const budget = enquiry.budgetPerSeat ?? null;

  const spaces = await prisma.space.findMany({
    where: {
      isActive: true,
      status: { in: ["active", "waitlisted"] },
      city: enquiry.city,
      // pre-filter in the DB: at least half the needed seats must be available
      availableSeats: { gte: Math.floor(minSeat / 2) },
    },
    include: { operator: { select: { id: true, name: true } } },
  });

  const scored = spaces.map((s): ScoredSpace => {
    let score = 40; // in-city baseline
    const reasons: string[] = ["Same city"];

    if (
      enquiry.microMarket &&
      s.microMarket.toLowerCase() === enquiry.microMarket.toLowerCase()
    ) {
      score += 20;
      reasons.push("Exact micro-market");
    }

    if (
      enquiry.workspaceType &&
      enquiry.workspaceType !== "NOT_SURE" &&
      s.workspaceType === enquiry.workspaceType
    ) {
      score += 15;
      reasons.push("Workspace type match");
    }

    if (s.availableSeats >= minSeat) {
      score += 10;
      reasons.push(`${s.availableSeats} seats available`);
      if (s.availableSeats <= maxSeat * 1.5) {
        score += 5;
        reasons.push("Right-sized");
      }
    } else {
      score -= 15;
      reasons.push("Fewer seats than needed");
    }

    if (budget != null) {
      if (s.pricePerSeat <= budget) {
        score += 15;
        reasons.push("Within budget");
      } else if (s.pricePerSeat <= budget * 1.1) {
        score += 5;
        reasons.push("Slightly over budget");
      } else {
        score -= 10;
        reasons.push("Over budget");
      }
    }

    if (s.moveInReady === "ready") {
      score += 5;
      reasons.push("Move-in ready");
    }

    return {
      ...s,
      matchScore: Math.max(0, Math.min(100, score)),
      matchReasons: reasons,
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return opts.limit ? scored.slice(0, opts.limit) : scored;
}
