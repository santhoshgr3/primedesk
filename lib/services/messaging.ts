import { prisma } from "@/lib/prisma";

/** Fill {{placeholders}} in a template body. */
export function renderTemplate(
  body: string,
  vars: Record<string, string | number | undefined | null>,
) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{{${key}}}`,
  );
}

export async function recordMessage(params: {
  enquiryId: string;
  channel: "whatsapp" | "email" | "sms";
  direction: "outbound" | "inbound";
  content: string;
  templateId?: string;
  sentBy?: string;
  status?: string;
}) {
  const message = await prisma.message.create({
    data: {
      enquiryId: params.enquiryId,
      channel: params.channel,
      direction: params.direction,
      content: params.content,
      templateId: params.templateId ?? null,
      sentBy: params.sentBy ?? null,
      status: params.status ?? (params.direction === "inbound" ? "read" : "sent"),
    },
  });

  await prisma.activity.create({
    data: {
      enquiryId: params.enquiryId,
      type: params.channel,
      description: `${params.direction === "inbound" ? "↩ " : "→ "}${
        params.content.length > 140
          ? params.content.slice(0, 140) + "…"
          : params.content
      }`,
      performedBy: params.sentBy ?? "system",
    },
  });

  await prisma.enquiry.update({
    where: { id: params.enquiryId },
    data: { lastActivityAt: new Date() },
  });

  return message;
}
