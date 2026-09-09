import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { updateVisitSchema } from "@/lib/validators/visit";
import { logActivity } from "@/lib/services/enquiry";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const data = updateVisitSchema.parse(await req.json());
    const visit = await prisma.visit.update({
      where: { id: params.id },
      data,
      include: { space: { select: { name: true } } },
    });

    if (data.status) {
      await logActivity(
        visit.enquiryId,
        "note",
        `Visit ${data.status.replace(/_/g, " ")} — ${visit.space.name}`,
        guard.user.id,
      );
      if (data.status === "no_show") {
        await prisma.task.create({
          data: {
            type: "CALL",
            title: `Reschedule visit (no-show) — ${visit.space.name}`,
            dueDate: new Date(Date.now() + 4 * 3600 * 1000),
            enquiryId: visit.enquiryId,
            assignedToId: visit.advisorId,
            priority: "HIGH",
          },
        });
      }
    }

    return ok(visit);
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const visit = await prisma.visit.findUnique({
    where: { id: params.id },
    include: {
      enquiry: true,
      space: { include: { operator: true } },
      advisor: { select: { name: true } },
    },
  });
  if (!visit) return fail("Not found", 404);
  return ok(visit);
}
