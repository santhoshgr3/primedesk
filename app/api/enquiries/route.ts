import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError, parsePagination } from "@/lib/api";
import { fullEnquirySchema } from "@/lib/validators/enquiry";
import { logActivity } from "@/lib/services/enquiry";
import { scoreEnquiry } from "@/lib/services/scoring";
import { seatBounds } from "@/lib/seats";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, pageSize } = parsePagination(sp);

    const where: Prisma.EnquiryWhereInput = { isArchived: false };
    const q = sp.get("q")?.trim();
    if (q) {
      where.OR = [
        { companyName: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { contactPhone: { contains: q } },
      ];
    }
    for (const key of ["city", "status", "priority", "workspaceType"] as const) {
      const v = sp.get(key);
      if (v) (where as Record<string, unknown>)[key] = v;
    }
    const advisor = sp.get("assignedToId");
    if (advisor === "unassigned") where.assignedToId = null;
    else if (advisor) where.assignedToId = advisor;

    const source = sp.get("source");
    if (source) where.source = source as Prisma.EnquiryWhereInput["source"];

    const [total, rows] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { shortlists: true, visits: true, tasks: true } },
        },
      }),
    ]);

    return ok({ rows, total, page, pageSize });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR','MARKETING']);
  if ("response" in guard) return guard.response;

  try {
    const body = await req.json();
    const data = fullEnquirySchema.parse(body);

    const enquiry = await prisma.enquiry.create({
      data: {
        companyName: data.companyName,
        industry: data.industry || null,
        companySize: data.companySize ?? null,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail || null,
        contactDesig: data.contactDesig || null,
        seatsNeeded: data.seatsNeeded,
        seatsMin: seatBounds(data.seatsNeeded).min,
        seatsMax: seatBounds(data.seatsNeeded).max,
        city: data.city,
        microMarket: data.microMarket || null,
        workspaceType: data.workspaceType,
        budgetPerSeat: data.budgetPerSeat ?? null,
        moveInTimeline: data.moveInTimeline || null,
        amenityPriority: data.amenityPriority ?? [],
        notes: data.notes || null,
        source: data.source,
        priority: data.priority,
        assignedToId: data.assignedToId || null,
        status: data.assignedToId ? "ADVISOR_ASSIGNED" : "NEW",
        lastActivityAt: new Date(),
      },
    });

    await logActivity(enquiry.id, "note", "Enquiry created", guard.user.id);

    // SLA task: call within 2 hours
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 2);
    await prisma.task.create({
      data: {
        type: "CALL",
        title: `Call ${enquiry.companyName} within 2 hours`,
        dueDate,
        enquiryId: enquiry.id,
        assignedToId: data.assignedToId || guard.user.id,
        priority: "URGENT",
      },
    });

    const scored = await scoreEnquiry(enquiry.id).catch(() => null);

    return ok({ ...enquiry, ...(scored ?? {}) }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
