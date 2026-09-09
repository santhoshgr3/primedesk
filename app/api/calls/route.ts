import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";

const schema = z.object({
  enquiryId: z.string().min(1),
  direction: z.enum(["outbound", "inbound"]).default("outbound"),
  outcome: z.enum([
    "connected",
    "no_answer",
    "busy",
    "wrong_number",
    "voicemail",
  ]),
  durationSec: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  const enquiryId = req.nextUrl.searchParams.get("enquiryId") ?? undefined;
  const calls = await prisma.callLog.findMany({
    where: { enquiryId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 100,
  });
  return ok(calls);
}

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const data = schema.parse(await req.json());
    const call = await prisma.callLog.create({
      data: { ...data, userId: guard.user.id, notes: data.notes || null },
    });

    const mins = Math.round(data.durationSec / 60);
    await logActivity(
      data.enquiryId,
      "call",
      `${data.direction === "inbound" ? "Inbound" : "Outbound"} call — ${
        data.outcome
      }${mins ? ` (${mins}m)` : ""}${data.notes ? `: ${data.notes}` : ""}`,
      guard.user.id,
      data.outcome,
    );

    return ok(call, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
