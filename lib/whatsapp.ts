/**
 * WhatsApp Business API client stub (Meta Cloud API).
 * Phase 3 implements real template sends + webhook ingestion.
 */
export type WhatsAppTemplatePayload = {
  to: string;
  templateKey: string;
  variables?: Record<string, string>;
};

export async function sendWhatsAppTemplate(payload: WhatsAppTemplatePayload) {
  if (!process.env.WHATSAPP_API_TOKEN) {
    console.log("[whatsapp] (noop — no token) would send", payload);
    return { id: `mock_${Date.now()}`, status: "queued" as const };
  }
  // TODO(phase-3): POST https://graph.facebook.com/v20.0/{phoneNumberId}/messages
  throw new Error("Live WhatsApp send not implemented yet");
}

/** Build a wa.me deep link for manual sends from the CRM. */
export function waMeLink(phone: string, text?: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
