/**
 * Email client stub (Resend). Phase 3 wires the real API + open/click tracking.
 */
export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
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
  // TODO(phase-3): POST https://api.resend.com/emails
  throw new Error("Live email send not implemented yet");
}
