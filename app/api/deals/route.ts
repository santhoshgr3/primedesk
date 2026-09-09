import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { createDealSchema } from "@/lib/validators/deal";
import { createDealFromEnquiry } from "@/lib/services/deal";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const where: Prisma.DealWhereInput = {};
    if (sp.get("advisorId")) where.advisorId = sp.get("advisorId")!;
    if (sp.get("stage")) where.stage = sp.get("stage") as never;
    if (sp.get("open") === "1") where.stage = { notIn: ["MOVED_IN", "LOST"] };
    if (sp.get("commissionStatus"))
      where.commissionStatus = sp.get("commissionStatus")!;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        enquiry: { select: { id: true, companyName: true, city: true } },
        space: { select: { id: true, name: true, microMarket: true } },
        operator: { select: { id: true, name: true } },
        advisor: { select: { id: true, name: true } },
        stageHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return ok(deals);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR']);
  if ("response" in guard) return guard.response;

  try {
    const data = createDealSchema.parse(await req.json());
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: data.enquiryId },
    });
    if (!enquiry) return ok({ error: "Enquiry not found" }, { status: 404 });

    const deal = await createDealFromEnquiry({
      enquiryId: data.enquiryId,
      spaceId: data.spaceId,
      advisorId: data.advisorId || enquiry.assignedToId || guard.user.id,
      seats: data.seats,
      pricePerSeat: data.pricePerSeat,
      lockInMonths: data.lockInMonths,
      depositPaid: data.depositPaid,
      startDate: data.startDate,
      stage: data.stage,
    });

    return ok(deal, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
