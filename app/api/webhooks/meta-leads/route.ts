import type { NextRequest } from "next/server";
import { createInboundEnquiry } from "@/lib/services/enquiry";
import { verifyMetaSignature } from "@/lib/webhook-verify";
import { enforceRateLimit } from "@/lib/rate-limit";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (
    sp.get("hub.mode") === "subscribe" &&
    sp.get("hub.verify_token") === process.env.META_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(sp.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Facebook / Instagram Lead Ads → new enquiry.
 * Accepts either a raw Meta leadgen payload or a normalised
 * { fields: {...}, leadId } shape (used by the CRM's own test form).
 */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "wh:meta", {
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
    const body = JSON.parse(raw || "{}");

    // Normalised shape
    if (body.fields) {
      const f = body.fields as Record<string, string>;
      const enquiry = await createInboundEnquiry({
        companyName: f.company_name || f.company || "Unknown (Meta lead)",
        contactName: f.full_name || f.name || "Meta Lead",
        contactPhone: f.phone_number || f.phone || "",
        contactEmail: f.email ?? null,
        seatsNeeded: f.seats || "20-50",
        city: f.city || "Hyderabad",
        workspaceType: (f.workspace_type as never) || "NOT_SURE",
        source: body.platform === "instagram" ? "INSTAGRAM_ADS" : "FACEBOOK_ADS",
        metaLeadId: body.leadId ?? null,
      });
      return Response.json({ ok: true, enquiryId: enquiry.id });
    }

    // Raw Meta leadgen webhook
    const entries = body?.entry ?? [];
    let created = 0;
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const v = change.value ?? {};
        const map: Record<string, string> = {};
        for (const fd of v.field_data ?? []) {
          map[fd.name] = Array.isArray(fd.values) ? fd.values[0] : fd.values;
        }
        await createInboundEnquiry({
          companyName: map.company_name || "Unknown (Meta lead)",
          contactName: map.full_name || "Meta Lead",
          contactPhone: map.phone_number || "",
          contactEmail: map.email ?? null,
          seatsNeeded: map.seats || "20-50",
          city: map.city || "Hyderabad",
          source: "FACEBOOK_ADS",
          metaLeadId: v.leadgen_id ?? null,
        });
        created++;
      }
    }
    return Response.json({ ok: true, created });
  } catch (err) {
    console.error("[webhook:meta-leads]", err);
    return new Response("error", { status: 200 });
  }
}
