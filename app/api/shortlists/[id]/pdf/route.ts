import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { renderShortlistHTML } from "@/lib/shortlist-pdf";

/**
 * Returns a branded, print-to-PDF ready HTML document for the shortlist.
 * (Server-side PDF rendering via headless Chrome can be layered on in Phase 6.)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const shortlist = await prisma.shortlist.findUnique({
    where: { id: params.id },
    include: {
      enquiry: true,
      advisor: { select: { name: true, email: true, phone: true } },
      items: {
        orderBy: { rank: "asc" },
        include: { space: { include: { operator: { select: { name: true } } } } },
      },
    },
  });
  if (!shortlist) return new Response("Not found", { status: 404 });

  const settings = await getSettings();
  const html = renderShortlistHTML(
    {
      shortlistId: shortlist.id,
      version: shortlist.version,
      createdAt: shortlist.createdAt,
      enquiry: {
        companyName: shortlist.enquiry.companyName,
        contactName: shortlist.enquiry.contactName,
        seatsNeeded: shortlist.enquiry.seatsNeeded,
        city: shortlist.enquiry.city,
        workspaceType: shortlist.enquiry.workspaceType,
      },
      advisor: shortlist.advisor,
      spaces: shortlist.items.map((it) => ({
        name: it.space.name,
        city: it.space.city,
        microMarket: it.space.microMarket,
        address: it.space.address,
        workspaceType: it.space.workspaceType,
        availableSeats: it.space.availableSeats,
        pricePerSeat: it.space.pricePerSeat,
        lockInMonths: it.space.lockInMonths,
        depositMonths: it.space.depositMonths,
        amenities: it.space.amenities,
        moveInReady: it.space.moveInReady,
        images: it.space.images,
        operator: { name: it.space.operator.name },
        advisorNote: it.advisorNote,
      })),
    },
    settings,
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
