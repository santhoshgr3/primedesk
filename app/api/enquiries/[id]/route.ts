import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { updateEnquirySchema } from "@/lib/validators/enquiry";
import { changeStatus, logActivity } from "@/lib/services/enquiry";
import { seatBounds } from "@/lib/seats";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        shortlists: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { space: true } } },
        },
        visits: {
          orderBy: { scheduledAt: "desc" },
          include: { space: { select: { name: true, city: true } } },
        },
        deals: { include: { space: { select: { name: true } } } },
        tasks: { orderBy: { dueDate: "asc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 100 },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!enquiry) return fail("Not found", 404);
    return ok(enquiry);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN','ADVISOR','MARKETING','OPERATIONS']);
  if ("response" in guard) return guard.response;

  try {
    const existing = await prisma.enquiry.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Not found", 404);

    const body = await req.json();
    const data = updateEnquirySchema.parse(body);
    const { status, ...fields } = data;

    const cleaned = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined && v !== ""),
    );

    if (typeof cleaned.seatsNeeded === "string") {
      const b = seatBounds(cleaned.seatsNeeded);
      cleaned.seatsMin = b.min;
      cleaned.seatsMax = b.max;
    }

    if (Object.keys(cleaned).length) {
      await prisma.enquiry.update({
        where: { id: params.id },
        data: { ...cleaned, lastActivityAt: new Date() },
      });
      await logActivity(
        params.id,
        "note",
        `Updated: ${Object.keys(cleaned).join(", ")}`,
        guard.user.id,
      );
    }

    if (status && status !== existing.status) {
      await changeStatus(params.id, status, guard.user.id);
    }

    const updated = await prisma.enquiry.findUnique({
      where: { id: params.id },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN")
    return fail("Only admins can archive enquiries", 403);

  try {
    await prisma.enquiry.update({
      where: { id: params.id },
      data: { isArchived: true },
    });
    return ok({ archived: true });
  } catch (err) {
    return handleError(err);
  }
}
