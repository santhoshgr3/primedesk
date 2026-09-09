import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/services/messaging";

/**
 * WhatsApp Business API client (Meta Cloud API).
 * Live when WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set; otherwise
 * every call is a logged no-op so the rest of the app works in dev.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

function isLive() {
  return (
    !!process.env.WHATSAPP_API_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

function normalizeTo(phone: string) {
  // Meta wants digits only, with country code. Assume +91 if 10 digits.
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}

async function post(body: unknown) {
  const res = await fetch(
    `${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `WhatsApp send failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return { id: json.messages?.[0]?.id ?? null, status: "sent" as const };
}

export type WhatsAppTemplatePayload = {
  to: string;
  templateKey: string;
  variables?: Record<string, string>;
};

/**
 * Send using a CRM MessageTemplate. In live mode we send the rendered body as
 * a plain text message (valid inside the 24h customer-care window). For
 * business-initiated sends outside that window, use `sendApprovedTemplate`.
 */
export async function sendWhatsAppTemplate(payload: WhatsAppTemplatePayload) {
  if (!isLive()) {
    console.log("[whatsapp] (noop — no credentials) would send", payload);
    return { id: `mock_${Date.now()}`, status: "queued" as const };
  }

  let text = "";
  const tpl = await prisma.messageTemplate
    .findUnique({ where: { key: payload.templateKey } })
    .catch(() => null);
  if (tpl) text = renderTemplate(tpl.body, payload.variables ?? {});
  else text = payload.variables?.text ?? `(${payload.templateKey})`;

  return post({
    messaging_product: "whatsapp",
    to: normalizeTo(payload.to),
    type: "text",
    text: { body: text },
  });
}

/** Send a Meta-approved template (business-initiated, any time). */
export async function sendApprovedTemplate(opts: {
  to: string;
  name: string;
  language?: string;
  bodyParams?: string[];
}) {
  if (!isLive()) {
    console.log("[whatsapp] (noop) approved template", opts);
    return { id: `mock_${Date.now()}`, status: "queued" as const };
  }
  return post({
    messaging_product: "whatsapp",
    to: normalizeTo(opts.to),
    type: "template",
    template: {
      name: opts.name,
      language: { code: opts.language ?? "en" },
      ...(opts.bodyParams?.length
        ? {
            components: [
              {
                type: "body",
                parameters: opts.bodyParams.map((t) => ({
                  type: "text",
                  text: t,
                })),
              },
            ],
          }
        : {}),
    },
  });
}

/** Build a wa.me deep link for manual sends from the CRM. */
export function waMeLink(phone: string, text?: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
