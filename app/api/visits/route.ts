import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { createVisitSchema } from "@/lib/validators/visit";
import { logActivity, changeStatus } from "@/lib/services/enquiry";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const where: Prisma.VisitWhereInput = {};
    if (sp.get("from") || sp.get("to")) {
      where.scheduledAt = {};
      if (sp.get("from")) where.scheduledAt.gte = new Date(sp.get("from")!);
      if (sp.get("to")) where.scheduledAt.lte = new Date(sp.get("to")!);
    }
    if (sp.get("advisorId")) where.advisorId = sp.get("advisorId")!;
    if (sp.get("status")) where.status = sp.get("status")!;
    if (sp.get("enquiryId")) where.enquiryId = sp.get("enquiryId")!;

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        enquiry: { select: { id: true, companyName: true, contactName: true } },
        space: {
          select: { id: true, name: true, city: true, microMarket: true },
        },
        advisor: { select: { id: true, name: true } },
      },
    });
    return ok(visits);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR','OPERATIONS']);
  if ("response" in guard) return guard.response;

  try {
    const data = createVisitSchema.parse(await req.json());
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: data.enquiryId },
    });
    if (!enquiry) return ok({ error: "Enquiry not found" }, { status: 404 });

    const advisorId =
      data.advisorId || enquiry.assignedToId || guard.user.id;

    const visit = await prisma.visit.create({
      data: {
        enquiryId: data.enquiryId,
        spaceId: data.spaceId,
        advisorId,
        scheduledAt: data.scheduledAt,
        type: data.type,
        operatorContact: data.operatorContact || null,
      },
      include: { space: { select: { name: true } } },
    });

    // Reminder tasks: 1 day before + 2 hours before.
    const dayBefore = new Date(data.scheduledAt.getTime() - 24 * 3600 * 1000);
    const twoHrBefore = new Date(data.scheduledAt.getTime() - 2 * 3600 * 1000);
    await prisma.task.createMany({
      data: [
        {
          type: "WHATSAPP",
          title: `Send 1-day visit reminder — ${visit.space.name}`,
          dueDate: dayBefore,
          enquiryId: data.enquiryId,
          assignedToId: advisorId,
          priority: "MEDIUM",
        },
        {
          type: "WHATSAPP",
          title: `Send 2-hour visit reminder — ${visit.space.name}`,
          dueDate: twoHrBefore,
          enquiryId: data.enquiryId,
          assignedToId: advisorId,
          priority: "HIGH",
        },
      ],
    });

    await sendWhatsAppTemplate({
      to: enquiry.contactPhone,
      templateKey: "visit_confirmation",
      variables: {
        date: data.scheduledAt.toLocaleString("en-IN"),
        location: visit.space.name,
      },
    });

    await logActivity(
      data.enquiryId,
      "visit_scheduled",
      `Visit scheduled at ${visit.space.name} for ${data.scheduledAt.toLocaleString(
        "en-IN",
      )}`,
      guard.user.id,
    );

    if (["SHORTLIST_SENT", "REQUIREMENT_CALL_DONE"].includes(enquiry.status)) {
      await changeStatus(data.enquiryId, "VISIT_SCHEDULED", guard.user.id);
    }

    return ok(visit, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
