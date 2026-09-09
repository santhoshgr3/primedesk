import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";

const schema = z.object({
  outcome: z
    .enum(["connected", "no_answer", "interested", "not_now", "lost", "done"])
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { outcome } = schema.parse(await req.json().catch(() => ({})));
    const task = await prisma.task.update({
      where: { id: params.id },
      data: { status: "done", completedAt: new Date(), outcome },
    });

    if (task.enquiryId) {
      await logActivity(
        task.enquiryId,
        task.type.toLowerCase().includes("call") ? "call" : "note",
        `Task completed: ${task.title}`,
        guard.user.id,
        outcome,
      );
    }
    return ok(task);
  } catch (err) {
    return handleError(err);
  }
}
