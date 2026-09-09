import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { scoreEnquiry } from "@/lib/services/scoring";

/**
 * Nightly re-score of all open enquiries so engagement decay (going quiet)
 * pulls stale leads down to warm/cold. Run daily.
 */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) return new Response("Unauthorized", { status: 401 });

  const open = await prisma.enquiry.findMany({
    where: {
      isArchived: false,
      status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
    },
    select: { id: true },
    take: 2000,
  });

  let changed = 0;
  for (const e of open) {
    const before = await prisma.enquiry.findUnique({
      where: { id: e.id },
      select: { priority: true },
    });
    const res = await scoreEnquiry(e.id).catch(() => null);
    if (res && before && res.priority !== before.priority) changed++;
  }

  return Response.json({ rescored: open.length, priorityChanged: changed });
}

export const GET = POST;
