import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { getSettings } from "@/lib/settings";
import { notify } from "@/lib/services/notify";

/**
 * Escalates tasks that have been overdue longer than the SLA threshold
 * to the relevant manager (ADMIN) by cloning a HIGH-priority nudge task.
 * Run hourly.
 */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) return new Response("Unauthorized", { status: 401 });

  const settings = await getSettings();
  const cutoff = new Date(
    Date.now() - settings.sla.overdueEscalationHours * 3600 * 1000,
  );

  const stale = await prisma.task.findMany({
    where: {
      status: "pending",
      dueDate: { lt: cutoff },
      title: { not: { startsWith: "⚠ Escalated:" } },
    },
    include: { enquiry: { select: { companyName: true } } },
    take: 200,
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (!admins.length) return Response.json({ escalated: 0 });

  let escalated = 0;
  for (const t of stale) {
    const dupe = await prisma.task.findFirst({
      where: {
        title: `⚠ Escalated: ${t.title}`,
        status: "pending",
        enquiryId: t.enquiryId,
      },
    });
    if (dupe) continue;

    const owner = admins[escalated % admins.length].id;
    await prisma.task.create({
      data: {
        type: t.type,
        title: `⚠ Escalated: ${t.title}`,
        description: `Original task overdue > ${settings.sla.overdueEscalationHours}h${
          t.enquiry ? ` for ${t.enquiry.companyName}` : ""
        }`,
        dueDate: new Date(Date.now() + 4 * 3600 * 1000),
        enquiryId: t.enquiryId,
        assignedToId: owner,
        priority: "URGENT",
      },
    });
    await notify(owner, {
      type: "task_escalation",
      title: `Overdue task escalated${
        t.enquiry ? ` — ${t.enquiry.companyName}` : ""
      }`,
      body: t.title,
      link: t.enquiryId ? `/enquiries/${t.enquiryId}` : "/tasks",
    });
    escalated++;
  }

  return Response.json({ stale: stale.length, escalated });
}

export const GET = POST;
