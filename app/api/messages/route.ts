import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { renderTemplate, recordMessage } from "@/lib/services/messaging";
import { sendWhatsAppTemplate, waMeLink } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const enquiryId = req.nextUrl.searchParams.get("enquiryId");
    if (enquiryId) {
      const messages = await prisma.message.findMany({
        where: { enquiryId },
        orderBy: { sentAt: "asc" },
      });
      return ok(messages);
    }

    // Thread list: latest message per enquiry.
    const recent = await prisma.message.findMany({
      orderBy: { sentAt: "desc" },
      take: 200,
      include: {
        enquiry: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            contactPhone: true,
            status: true,
          },
        },
      },
    });
    const seen = new Set<string>();
    const threads = recent.filter((m) => {
      if (seen.has(m.enquiryId)) return false;
      seen.add(m.enquiryId);
      return true;
    });
    return ok(threads);
  } catch (err) {
    return handleError(err);
  }
}

const sendSchema = z.object({
  enquiryId: z.string().min(1),
  channel: z.enum(["whatsapp", "email"]).default("whatsapp"),
  templateKey: z.string().optional(),
  body: z.string().optional(),
  subject: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','ADVISOR','MARKETING']);
  if ("response" in guard) return guard.response;

  try {
    const data = sendSchema.parse(await req.json());
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: data.enquiryId },
    });
    if (!enquiry) return fail("Enquiry not found", 404);

    let content = data.body ?? "";
    if (data.templateKey) {
      const tpl = await prisma.messageTemplate.findUnique({
        where: { key: data.templateKey },
      });
      if (!tpl) return fail("Template not found", 404);
      content = renderTemplate(tpl.body, {
        name: enquiry.contactName,
        company: enquiry.companyName,
        advisor: guard.user.name ?? "your advisor",
        ...data.variables,
      });
    }
    if (!content) return fail("Message body or template required", 400);

    if (data.channel === "whatsapp") {
      await sendWhatsAppTemplate({
        to: enquiry.contactPhone,
        templateKey: data.templateKey ?? "freeform",
        variables: data.variables,
      });
    } else {
      await sendEmail({
        to: enquiry.contactEmail ?? "",
        subject: data.subject ?? "A note from PrimeDesk",
        html: `<p>${content}</p>`,
      });
    }

    const message = await recordMessage({
      enquiryId: data.enquiryId,
      channel: data.channel,
      direction: "outbound",
      content,
      templateId: data.templateKey,
      sentBy: guard.user.id,
    });

    return ok(
      { message, waLink: waMeLink(enquiry.contactPhone, content) },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
