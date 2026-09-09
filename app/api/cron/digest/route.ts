import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { sendEmail } from "@/lib/email";

/** 9 AM morning digest — per-advisor task list for the day. Run daily. */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) return new Response("Unauthorized", { status: 401 });

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const advisors = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["ADVISOR", "OPERATIONS"] } },
  });

  const digests: { advisor: string; tasks: number }[] = [];

  for (const a of advisors) {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: a.id,
        status: "pending",
        dueDate: { lte: endOfDay },
      },
      orderBy: { dueDate: "asc" },
      include: { enquiry: { select: { companyName: true } } },
    });
    if (!tasks.length) continue;

    const rows = tasks
      .map(
        (t) =>
          `<li><strong>${t.title}</strong>${
            t.enquiry ? ` — ${t.enquiry.companyName}` : ""
          } <em>(due ${t.dueDate.toLocaleTimeString("en-IN")})</em></li>`,
      )
      .join("");

    await sendEmail({
      to: a.email,
      subject: `Your PrimeDesk tasks today (${tasks.length})`,
      html: `<h2>Good morning, ${a.name}</h2><p>You have ${tasks.length} task(s) due today:</p><ul>${rows}</ul>`,
    });
    digests.push({ advisor: a.name, tasks: tasks.length });
  }

  return Response.json({ sent: digests.length, digests });
}

export const GET = POST;
