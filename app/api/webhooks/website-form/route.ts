import type { NextRequest } from "next/server";
import { z } from "zod";
import { createInboundEnquiry } from "@/lib/services/enquiry";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactPhone: z.string().min(6),
  contactEmail: z.string().email().optional(),
  seatsNeeded: z.string().default("20-50"),
  city: z.string().default("Hyderabad"),
  microMarket: z.string().optional(),
  workspaceType: z
    .enum([
      "MANAGED_OFFICE",
      "COWORKING",
      "PLUG_AND_PLAY",
      "CUSTOMIZED",
      "GCC_ENTERPRISE",
      "NOT_SURE",
    ])
    .optional(),
  budgetPerSeat: z.coerce.number().optional(),
  moveInTimeline: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "wh:form", {
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const data = schema.parse(await req.json());
    const enquiry = await createInboundEnquiry({
      ...data,
      source: "WEBSITE_FORM",
    });
    return Response.json({ ok: true, enquiryId: enquiry.id }, { status: 201 });
  } catch (err) {
    console.error("[webhook:website-form]", err);
    return Response.json({ ok: false }, { status: 400 });
  }
}
