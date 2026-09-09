/**
 * Email client (Resend). Live when RESEND_API_KEY is set; otherwise a logged
 * no-op. Attachments are passed as public URLs (Resend fetches them).
 */
export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; url: string }[];
};

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] (noop — no RESEND_API_KEY)", {
      to: payload.to,
      subject: payload.subject,
    });
    return { id: `mock_${Date.now()}`, status: "queued" as const };
  }
  if (!payload.to) {
    return { id: null, status: "skipped" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "PrimeDesk <noreply@primedesk.co.in>",
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      ...(payload.attachments?.length
        ? { attachments: payload.attachments.map((a) => ({ filename: a.filename, path: a.url })) }
        : {}),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Email send failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return { id: json.id ?? null, status: "sent" as const };
}
