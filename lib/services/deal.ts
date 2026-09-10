import { prisma } from "@/lib/prisma";
import type { DealStage } from "@prisma/client";
import { logActivity } from "@/lib/services/enquiry";
import { notify } from "@/lib/services/notify";

/** Commission = operator rate % × first month's value (PLAN Workflow 3). */
export function computeCommission(
  monthlyValue: number,
  ratePct: number | null | undefined,
) {
  if (!ratePct) return 0;
  return Math.round(monthlyValue * (ratePct / 100));
}

export async function createDealFromEnquiry(params: {
  enquiryId: string;
  spaceId: string;
  advisorId: string;
  seats: number;
  pricePerSeat: number;
  lockInMonths?: number;
  depositPaid?: number;
  startDate?: Date;
  stage?: DealStage;
}) {
  const space = await prisma.space.findUnique({
    where: { id: params.spaceId },
    include: { operator: true },
  });
  if (!space) throw new Error("Space not found");

  const monthlyValue = params.seats * params.pricePerSeat;
  const commissionRate = space.operator.commissionRate ?? null;

  const deal = await prisma.deal.create({
    data: {
      enquiryId: params.enquiryId,
      spaceId: params.spaceId,
      operatorId: space.operatorId,
      advisorId: params.advisorId,
      stage: params.stage ?? "REQUIREMENT_QUALIFIED",
      seats: params.seats,
      pricePerSeat: params.pricePerSeat,
      monthlyValue,
      lockInMonths: params.lockInMonths ?? space.lockInMonths ?? null,
      depositPaid: params.depositPaid ?? null,
      startDate: params.startDate ?? null,
      commissionRate,
      commissionValue: computeCommission(monthlyValue, commissionRate),
      commissionStatus: "pending",
    },
  });

  await prisma.dealStageHistory.create({
    data: { dealId: deal.id, toStage: deal.stage, changedBy: params.advisorId },
  });
  await logActivity(
    params.enquiryId,
    "deal_update",
    `Deal opened for ${space.name} — ${params.seats} seats @ ₹${params.pricePerSeat}/seat`,
    params.advisorId,
  );

  return deal;
}

const STAGE_TO_ENQUIRY_STATUS: Partial<Record<DealStage, string>> = {
  NEGOTIATING_TERMS: "NEGOTIATION",
  MOVED_IN: "CLOSED_WON",
  LOST: "CLOSED_LOST",
};

export async function moveDealStage(
  dealId: string,
  toStage: DealStage,
  userId: string,
  lostReason?: string,
) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");
  if (deal.stage === toStage) return deal;

  const movedIn = toStage === "MOVED_IN";

  const updated = await prisma.$transaction(async (tx) => {
    const d = await tx.deal.update({
      where: { id: dealId },
      data: {
        stage: toStage,
        lostReason: toStage === "LOST" ? lostReason ?? null : deal.lostReason,
        movedInAt: movedIn ? new Date() : deal.movedInAt,
        commissionValue: movedIn
          ? computeCommission(deal.monthlyValue, deal.commissionRate)
          : deal.commissionValue,
        version: { increment: 1 },
      },
    });

    await tx.dealStageHistory.create({
      data: {
        dealId,
        fromStage: deal.stage,
        toStage,
        changedBy: userId,
      },
    });

    await tx.activity.create({
      data: {
        enquiryId: deal.enquiryId,
        type: "deal_update",
        description: `Deal moved ${deal.stage} → ${toStage}${
          lostReason ? ` (${lostReason})` : ""
        }`,
        performedBy: userId,
      },
    });

    // On move-in, decrement the space's available seats.
    if (movedIn) {
      await tx.space.update({
        where: { id: deal.spaceId },
        data: { availableSeats: { decrement: deal.seats } },
      });
    }

    const enquiryStatus = STAGE_TO_ENQUIRY_STATUS[toStage];
    if (enquiryStatus) {
      await tx.enquiry.update({
        where: { id: deal.enquiryId },
        data: { status: enquiryStatus as never, lastActivityAt: new Date() },
      });
    }

    return d;
  });

  if (movedIn && deal.advisorId !== userId) {
    const e = await prisma.enquiry.findUnique({
      where: { id: deal.enquiryId },
      select: { companyName: true },
    });
    await notify(deal.advisorId, {
      type: "deal_won",
      title: `Deal won 🎉 — ${e?.companyName ?? "client"}`,
      body: `${deal.seats} seats · ₹${Math.round(
        deal.monthlyValue,
      ).toLocaleString("en-IN")}/mo`,
      link: `/pipeline?deal=${deal.id}`,
    });
  }

  return updated;
}
