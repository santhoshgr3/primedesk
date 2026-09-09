import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { writeAudit } from "@/lib/services/audit";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["assign", "archive", "unarchive", "priority", "status"]),
  assignedToId: z.string().optional(),
  priority: z.enum(["hot", "warm", "cold"]).optional(),
  status: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR','MARKETING']);
  if ("response" in guard) return guard.response;

  try {
    const { ids, action, assignedToId, priority, status } = schema.parse(
      await req.json(),
    );

    let data: Record<string, unknown> = {};
    if (action === "assign") {
      if (!assignedToId) return fail("assignedToId required", 400);
      data = { assignedToId, status: "ADVISOR_ASSIGNED" };
    } else if (action === "archive") data = { isArchived: true };
    else if (action === "unarchive") data = { isArchived: false };
    else if (action === "priority") {
      if (!priority) return fail("priority required", 400);
      data = { priority };
    } else if (action === "status") {
      if (!status) return fail("status required", 400);
      data = { status };
    }

    const res = await prisma.enquiry.updateMany({
      where: { id: { in: ids } },
      data: { ...data, lastActivityAt: new Date() },
    });

    await prisma.activity.createMany({
      data: ids.map((enquiryId) => ({
        enquiryId,
        type: "note",
        description: `Bulk ${action}`,
        performedBy: guard.user.id,
      })),
    });

    await writeAudit(guard.user.id, `enquiry.bulk_${action}`, undefined, {
      count: res.count,
    });
    return ok({ updated: res.count });
  } catch (err) {
    return handleError(err);
  }
}
