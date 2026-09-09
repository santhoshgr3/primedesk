import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { visitOutcomeSchema } from "@/lib/validators/visit";
import { logActivity, changeStatus } from "@/lib/services/enquiry";
import { createDealFromEnquiry } from "@/lib/services/deal";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { outcome, clientFeedback, nextStep, createDeal } =
      visitOutcomeSchema.parse(await req.json());

    const visit = await prisma.visit.update({
      where: { id: params.id },
      data: {
        status: "done",
        outcome,
        clientFeedback: clientFeedback || null,
        nextStep: nextStep || null,
      },
      include: { enquiry: true, space: true },
    });

    await logActivity(
      visit.enquiryId,
      "note",
      `Visit outcome (${visit.space.name}): ${outcome.replace(/_/g, " ")}${
        clientFeedback ? ` — ${clientFeedback}` : ""
      }`,
      guard.user.id,
    );

    await changeStatus(visit.enquiryId, "VISIT_DONE", guard.user.id);

    let deal = null;
    if (createDeal && outcome === "interested") {
      const seatsGuess =
        { "20-50": 35, "50-100": 75, "100-200": 150, "200+": 250 }[
          visit.enquiry.seatsNeeded
        ] ?? 50;
      deal = await createDealFromEnquiry({
        enquiryId: visit.enquiryId,
        spaceId: visit.spaceId,
        advisorId: visit.advisorId,
        seats: seatsGuess,
        pricePerSeat: visit.space.pricePerSeat,
        lockInMonths: visit.space.lockInMonths ?? undefined,
        stage: "VISIT_DONE",
      });
    } else if (outcome === "needs_another") {
      await prisma.task.create({
        data: {
          type: "WHATSAPP",
          title: "Send a revised shortlist",
          dueDate: new Date(Date.now() + 24 * 3600 * 1000),
          enquiryId: visit.enquiryId,
          assignedToId: visit.advisorId,
          priority: "HIGH",
        },
      });
    }

    return ok({ visit, deal });
  } catch (err) {
    return handleError(err);
  }
}
