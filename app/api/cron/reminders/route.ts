import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { recordMessage } from "@/lib/services/messaging";

/**
 * Sends due visit reminders. Run every 15–30 min.
 * A reminder is "due" when the visit is within the window and no reminder
 * of that kind has been logged yet.
 */
export async function POST(req: NextRequest) {
  if (!authorizeCron(req)) return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const upcoming = await prisma.visit.findMany({
    where: {
      status: { in: ["scheduled", "confirmed"] },
      scheduledAt: {
        gte: new Date(now),
        lte: new Date(now + 26 * 3600 * 1000),
      },
    },
    include: { enquiry: true, space: { select: { name: true } } },
  });

  let oneDay = 0;
  let twoHour = 0;

  for (const v of upcoming) {
    const hoursOut = (v.scheduledAt.getTime() - now) / 3600000;
    const kindKey =
      hoursOut <= 2.5 ? "visit_reminder_2hr" : hoursOut <= 25 ? "visit_reminder_1day" : null;
    if (!kindKey) continue;

    const already = await prisma.message.findFirst({
      where: {
        enquiryId: v.enquiryId,
        templateId: kindKey,
        sentAt: { gte: new Date(now - 26 * 3600 * 1000) },
      },
    });
    if (already) continue;

    await sendWhatsAppTemplate({
      to: v.enquiry.contactPhone,
      templateKey: kindKey,
      variables: {
        time: v.scheduledAt.toLocaleTimeString("en-IN"),
        space: v.space.name,
      },
    });
    await recordMessage({
      enquiryId: v.enquiryId,
      channel: "whatsapp",
      direction: "outbound",
      content:
        kindKey === "visit_reminder_2hr"
          ? `2-hour reminder for visit at ${v.space.name}`
          : `1-day reminder for visit at ${v.space.name}`,
      templateId: kindKey,
    });

    if (kindKey === "visit_reminder_2hr") twoHour++;
    else oneDay++;
  }

  return Response.json({ checked: upcoming.length, oneDay, twoHour });
}

export const GET = POST;
