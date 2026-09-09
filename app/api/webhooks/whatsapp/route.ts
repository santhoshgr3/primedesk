import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordMessage } from "@/lib/services/messaging";
import { verifyMetaSignature } from "@/lib/webhook-verify";
import { enforceRateLimit } from "@/lib/rate-limit";

/** Meta webhook verification handshake. */
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/** Inbound WhatsApp messages → attach to the matching enquiry timeline. */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "wh:wa", {
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const raw = await req.text();
    if (
      !verifyMetaSignature(
        raw,
        req.headers.get("x-hub-signature-256"),
        process.env.META_APP_SECRET,
      )
    ) {
      return new Response("Invalid signature", { status: 401 });
    }
    const payload = JSON.parse(raw || "{}");
    const changes =
      payload?.entry?.flatMap((e: any) => e.changes ?? []) ?? [];

    for (const change of changes) {
      const messages = change?.value?.messages ?? [];
      for (const msg of messages) {
        const from: string = msg.from ?? "";
        const text: string =
          msg.text?.body ?? msg.button?.text ?? `[${msg.type ?? "message"}]`;

        const digits = from.replace(/[^\d]/g, "").slice(-10);
        const enquiry = await prisma.enquiry.findFirst({
          where: { contactPhone: { contains: digits } },
          orderBy: { createdAt: "desc" },
        });
        if (!enquiry) continue;

        await recordMessage({
          enquiryId: enquiry.id,
          channel: "whatsapp",
          direction: "inbound",
          content: text,
        });
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[webhook:whatsapp]", err);
    return new Response("error", { status: 200 }); // 200 so Meta doesn't retry-storm
  }
}
