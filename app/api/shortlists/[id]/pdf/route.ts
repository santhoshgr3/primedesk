import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { renderShortlistHTML } from "@/lib/shortlist-pdf";
import { renderShortlistPDF } from "@/lib/shortlist-pdf-render";

export const runtime = "nodejs";

/**
 * Branded shortlist as a real PDF (pdfkit). `?format=html` returns the
 * print-friendly HTML version instead.
 */
export async function GET(
  req: NextRequest,
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
  const model = {
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
  };

  const filename = `PrimeDesk-Shortlist-${shortlist.enquiry.companyName.replace(
    /[^\w]+/g,
    "-",
  )}-v${shortlist.version}`;

  if (req.nextUrl.searchParams.get("format") === "html") {
    return new Response(renderShortlistHTML(model, settings), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const pdf = await renderShortlistPDF(model, settings);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}.pdf"`,
      },
    });
  } catch (err) {
    // Fall back to the print-HTML if PDF rendering fails in this runtime.
    console.error("[shortlist-pdf] falling back to HTML:", err);
    return new Response(renderShortlistHTML(model, settings), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
