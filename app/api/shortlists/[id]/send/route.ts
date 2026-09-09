import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { sendShortlistSchema } from "@/lib/validators/shortlist";
import { logActivity, changeStatus } from "@/lib/services/enquiry";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(['ADMIN','ADVISOR']);
  if ("response" in guard) return guard.response;

  try {
    const { via } = sendShortlistSchema.parse(await req.json());
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
      include: { enquiry: true, items: true },
    });
    if (!shortlist) return fail("Not found", 404);

    const pdfUrl = `/api/shortlists/${shortlist.id}/pdf`;

    // Fire the sends (noop in dev without API keys).
    if (via.includes("whatsapp")) {
      await sendWhatsAppTemplate({
        to: shortlist.enquiry.contactPhone,
        templateKey: "shortlist_ready",
        variables: {
          name: shortlist.enquiry.contactName,
          count: String(shortlist.items.length),
        },
      });
      await prisma.message.create({
        data: {
          enquiryId: shortlist.enquiryId,
          channel: "whatsapp",
          direction: "outbound",
          content: `Shortlist v${shortlist.version} sent (${shortlist.items.length} spaces)`,
          templateId: "shortlist_ready",
          sentBy: guard.user.id,
        },
      });
    }
    if (via.includes("email")) {
      await prisma.message.create({
        data: {
          enquiryId: shortlist.enquiryId,
          channel: "email",
          direction: "outbound",
          content: `Shortlist v${shortlist.version} emailed with PDF`,
          sentBy: guard.user.id,
        },
      });
    }

    await prisma.shortlist.update({
      where: { id: params.id },
      data: { sentVia: via, sentAt: new Date(), pdfUrl },
    });

    await logActivity(
      shortlist.enquiryId,
      "shortlist_sent",
      `Shortlist v${shortlist.version} sent via ${via.join(" + ")}`,
      guard.user.id,
    );

    if (
      ["NEW", "ADVISOR_ASSIGNED", "REQUIREMENT_CALL_DONE"].includes(
        shortlist.enquiry.status,
      )
    ) {
      await changeStatus(shortlist.enquiryId, "SHORTLIST_SENT", guard.user.id);
    }

    return ok({ sent: true, via, pdfUrl });
  } catch (err) {
    return handleError(err);
  }
}
