import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { getSettings } from "@/lib/settings";

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string) {
  return s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** Downloadable .ics for a site visit — works with Google/Apple/Outlook. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const visit = await prisma.visit.findUnique({
    where: { id: params.id },
    include: {
      enquiry: { select: { companyName: true, contactName: true, contactPhone: true } },
      space: { select: { name: true, address: true } },
      advisor: { select: { name: true, email: true } },
    },
  });
  if (!visit) return new Response("Not found", { status: 404 });

  const settings = await getSettings();
  const start = new Date(visit.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${settings.branding.companyName}//CRM//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:visit-${visit.id}@primedesk`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(`Office visit — ${visit.enquiry.companyName} @ ${visit.space.name}`)}`,
    `LOCATION:${esc(visit.space.address)}`,
    `DESCRIPTION:${esc(
      `Client: ${visit.enquiry.contactName} (${visit.enquiry.contactPhone})\n` +
        `Advisor: ${visit.advisor.name}\n` +
        `Type: ${visit.type}`,
    )}`,
    `ORGANIZER;CN=${esc(visit.advisor.name)}:mailto:${
      visit.advisor.email ?? settings.branding.email
    }`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="visit-${visit.id}.ics"`,
    },
  });
}
