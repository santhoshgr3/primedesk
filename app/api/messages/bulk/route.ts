import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { renderTemplate, recordMessage } from "@/lib/services/messaging";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { writeAudit } from "@/lib/services/audit";

const schema = z.object({
  templateKey: z.string().min(1),
  filter: z
    .object({
      city: z.string().optional(),
      status: z.string().optional(),
      shortlistOlderThanDays: z.number().optional(),
      noResponse: z.boolean().optional(),
    })
    .default({}),
  limit: z.number().min(1).max(500).default(100),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (!["ADMIN", "MARKETING", "ADVISOR"].includes(guard.user.role))
    return fail("Forbidden", 403);

  try {
    const { templateKey, filter, limit } = schema.parse(await req.json());
    const tpl = await prisma.messageTemplate.findUnique({
      where: { key: templateKey },
    });
    if (!tpl) return fail("Template not found", 404);

    const where: Prisma.EnquiryWhereInput = { isArchived: false };
    if (filter.city) where.city = filter.city;
    if (filter.status) where.status = filter.status as never;
    if (filter.shortlistOlderThanDays) {
      const cutoff = new Date(
        Date.now() - filter.shortlistOlderThanDays * 86400000,
      );
      where.shortlists = { some: { sentAt: { lte: cutoff } } };
    }
    if (filter.noResponse) {
      where.shortlists = {
        ...(typeof where.shortlists === "object" ? where.shortlists : {}),
        some: { response: null, sentAt: { not: null } },
      };
    }

    const enquiries = await prisma.enquiry.findMany({ where, take: limit });

    let sent = 0;
    for (const e of enquiries) {
      await sendWhatsAppTemplate({
        to: e.contactPhone,
        templateKey,
        variables: { name: e.contactName },
      });
      await recordMessage({
        enquiryId: e.id,
        channel: "whatsapp",
        direction: "outbound",
        content: renderTemplate(tpl.body, { name: e.contactName }),
        templateId: templateKey,
        sentBy: guard.user.id,
      });
      sent++;
    }

    await writeAudit(guard.user.id, "message.bulk", undefined, {
      templateKey,
      sent,
    });
    return ok({ sent, matched: enquiries.length });
  } catch (err) {
    return handleError(err);
  }
}
