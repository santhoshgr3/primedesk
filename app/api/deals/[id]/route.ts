import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { updateDealSchema } from "@/lib/validators/deal";
import { computeCommission } from "@/lib/services/deal";
import { logActivity } from "@/lib/services/enquiry";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      enquiry: true,
      space: { include: { operator: true } },
      operator: true,
      advisor: { select: { name: true } },
      documents: true,
      stageHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!deal) return fail("Not found", 404);
  return ok(deal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const data = updateDealSchema.parse(await req.json());
    const existing = await prisma.deal.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Not found", 404);

    const seats = data.seats ?? existing.seats;
    const pricePerSeat = data.pricePerSeat ?? existing.pricePerSeat;
    const monthlyValue = seats * pricePerSeat;
    const commissionRate = data.commissionRate ?? existing.commissionRate;

    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        ...data,
        monthlyValue,
        commissionValue: computeCommission(monthlyValue, commissionRate),
      },
    });

    await logActivity(
      existing.enquiryId,
      "deal_update",
      `Deal terms updated (${seats} seats @ ₹${pricePerSeat})`,
      guard.user.id,
    );

    return ok(deal);
  } catch (err) {
    return handleError(err);
  }
}
