import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { parseCSV } from "@/lib/csv";
import { fullEnquirySchema } from "@/lib/validators/enquiry";
import { logActivity } from "@/lib/services/enquiry";
import { scoreEnquiry } from "@/lib/services/scoring";
import { writeAudit } from "@/lib/services/audit";
import { seatBounds } from "@/lib/seats";

const HEADER_ALIASES: Record<string, string> = {
  company: "companyName",
  "company name": "companyName",
  companyname: "companyName",
  contact: "contactName",
  "contact name": "contactName",
  name: "contactName",
  phone: "contactPhone",
  "contact phone": "contactPhone",
  mobile: "contactPhone",
  email: "contactEmail",
  "contact email": "contactEmail",
  seats: "seatsNeeded",
  "seats needed": "seatsNeeded",
  city: "city",
  "micro market": "microMarket",
  micromarket: "microMarket",
  type: "workspaceType",
  "workspace type": "workspaceType",
  budget: "budgetPerSeat",
  "budget per seat": "budgetPerSeat",
  timeline: "moveInTimeline",
  "move in timeline": "moveInTimeline",
  source: "source",
  industry: "industry",
  notes: "notes",
};

const WS_TYPES = [
  "MANAGED_OFFICE",
  "COWORKING",
  "PLUG_AND_PLAY",
  "CUSTOMIZED",
  "GCC_ENTERPRISE",
  "NOT_SURE",
];
const SOURCES = [
  "WEBSITE_FORM",
  "WHATSAPP_INBOUND",
  "LINKEDIN",
  "FACEBOOK_ADS",
  "INSTAGRAM_ADS",
  "GOOGLE_ADS",
  "REFERRAL",
  "COLD_CALL",
  "DIRECT_CALL",
  "WALK_IN",
  "OTHER",
];
const norm = (s: string, allowed: string[], fallback: string) => {
  const up = s.toUpperCase().replace(/[ &-]+/g, "_");
  return allowed.includes(up) ? up : fallback;
};

const SEAT_NORMALIZE = (v: string) => {
  const n = Number(v.replace(/\D/g, ""));
  if (!n) return v || "20-50";
  if (n <= 50) return "20-50";
  if (n <= 100) return "50-100";
  if (n <= 200) return "100-200";
  return "200+";
};

export async function POST(req: NextRequest) {
  const guard = await withAuth(["ADMIN", "ADVISOR", "MARKETING"]);
  if ("response" in guard) return guard.response;

  try {
    const ct = req.headers.get("content-type") ?? "";
    let csv: string;
    if (ct.includes("application/json")) {
      csv = (await req.json()).csv ?? "";
    } else {
      csv = await req.text();
    }
    if (!csv.trim()) return fail("Empty CSV", 400);

    const raw = parseCSV(csv);
    if (!raw.length) return fail("No data rows found", 400);
    if (raw.length > 1000) return fail("Max 1000 rows per import", 400);

    const created: string[] = [];
    const errors: { row: number; error: string }[] = [];
    let skipped = 0;

    for (let i = 0; i < raw.length; i++) {
      const src = raw[i];
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(src)) {
        const key = HEADER_ALIASES[k.toLowerCase().trim()] ?? k;
        mapped[key] = v;
      }

      if (!mapped.companyName || !mapped.contactPhone) {
        errors.push({ row: i + 2, error: "companyName and phone required" });
        continue;
      }

      // Dedup by last-10 phone digits.
      const digits = mapped.contactPhone.replace(/\D/g, "").slice(-10);
      if (digits.length >= 7) {
        const dup = await prisma.enquiry.findFirst({
          where: { contactPhone: { contains: digits }, isArchived: false },
          select: { id: true },
        });
        if (dup) {
          skipped++;
          continue;
        }
      }

      const parsed = fullEnquirySchema.safeParse({
        companyName: mapped.companyName,
        contactName: mapped.contactName || mapped.companyName,
        contactPhone: mapped.contactPhone,
        contactEmail: mapped.contactEmail || undefined,
        seatsNeeded: SEAT_NORMALIZE(mapped.seatsNeeded ?? ""),
        city: mapped.city || "Hyderabad",
        microMarket: mapped.microMarket || undefined,
        workspaceType: norm(
          mapped.workspaceType || "",
          WS_TYPES,
          "NOT_SURE",
        ),
        budgetPerSeat: mapped.budgetPerSeat
          ? Number(mapped.budgetPerSeat.replace(/[^\d.]/g, ""))
          : undefined,
        moveInTimeline: mapped.moveInTimeline || undefined,
        industry: mapped.industry || undefined,
        notes: mapped.notes || undefined,
        source: norm(mapped.source || "", SOURCES, "OTHER"),
      });

      if (!parsed.success) {
        errors.push({
          row: i + 2,
          error: parsed.error.issues.map((x) => x.message).join("; "),
        });
        continue;
      }

      const d = parsed.data;
      const enquiry = await prisma.enquiry.create({
        data: {
          companyName: d.companyName,
          contactName: d.contactName,
          contactPhone: d.contactPhone,
          contactEmail: d.contactEmail || null,
          industry: d.industry || null,
          seatsNeeded: d.seatsNeeded,
          seatsMin: seatBounds(d.seatsNeeded).min,
          seatsMax: seatBounds(d.seatsNeeded).max,
          city: d.city,
          microMarket: d.microMarket || null,
          workspaceType: d.workspaceType,
          budgetPerSeat: d.budgetPerSeat ?? null,
          moveInTimeline: d.moveInTimeline || null,
          notes: d.notes || null,
          source: d.source,
          status: "NEW",
          lastActivityAt: new Date(),
        },
      });
      await logActivity(enquiry.id, "note", "Imported from CSV", guard.user.id);
      await scoreEnquiry(enquiry.id).catch(() => {});
      created.push(enquiry.id);
    }

    await writeAudit(guard.user.id, "enquiry.import", undefined, {
      created: created.length,
      skipped,
      errors: errors.length,
    });

    return ok({
      created: created.length,
      skipped,
      errors,
      total: raw.length,
    });
  } catch (err) {
    return handleError(err);
  }
}
