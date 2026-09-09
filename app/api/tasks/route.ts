import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const scope = sp.get("scope") ?? "open"; // open | overdue | today | done
    const mine = sp.get("mine") === "1";

    const where: Prisma.TaskWhereInput = {};
    if (mine) where.assignedToId = guard.user.id;

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    if (scope === "overdue")
      Object.assign(where, { status: "pending", dueDate: { lt: now } });
    else if (scope === "today")
      Object.assign(where, {
        status: "pending",
        dueDate: { lte: endOfDay },
      });
    else if (scope === "done") where.status = "done";
    else where.status = "pending";

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        assignedTo: { select: { name: true } },
        enquiry: { select: { id: true, companyName: true } },
      },
      take: 200,
    });
    return ok(tasks);
  } catch (err) {
    return handleError(err);
  }
}

const createSchema = z.object({
  type: z
    .enum([
      "CALL",
      "WHATSAPP",
      "EMAIL",
      "SITE_VISIT",
      "SEND_DOCUMENT",
      "INTERNAL_MEETING",
      "FOLLOW_UP",
    ])
    .default("FOLLOW_UP"),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  enquiryId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const data = createSchema.parse(await req.json());
    const task = await prisma.task.create({
      data: {
        ...data,
        assignedToId: data.assignedToId || guard.user.id,
      },
    });
    return ok(task, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
