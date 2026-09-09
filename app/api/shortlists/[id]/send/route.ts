import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { sendShortlistSchema } from "@/lib/validators/shortlist";
import { logActivity, changeStatus } from "@/lib/services/enquiry";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { escapeHtml } from "@/lib/utils";

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
      include: {
        enquiry: true,
        advisor: { select: { name: true, email: true, phone: true } },
        items: true,
      },
    });
    if (!shortlist) return fail("Not found", 404);

    const settings = await getSettings();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const pdfUrl = `${base}/api/shortlists/${shortlist.id}/pdf`;

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
      const b = settings.branding;
      const html = `
        <div style="font-family:system-ui,sans-serif;color:#0f172a">
          <h2 style="color:${b.primaryColor}">${b.companyName}</h2>
          <p>Hi ${escapeHtml(shortlist.enquiry.contactName)},</p>
          <p>We've shortlisted <strong>${shortlist.items.length} office spaces</strong>
          matching your requirement in ${escapeHtml(shortlist.enquiry.city)}.
          The full details are in the attached PDF.</p>
          <p><a href="${pdfUrl}" style="background:${b.primaryColor};color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">View the shortlist</a></p>
          <p>Reply to this email or call ${escapeHtml(
            shortlist.advisor.phone ?? b.phone,
          )} to arrange a visit — zero brokerage, always.</p>
          <p>— ${escapeHtml(shortlist.advisor.name)}, ${b.companyName}</p>
        </div>`;
      await sendEmail({
        to: shortlist.enquiry.contactEmail ?? "",
        subject: `${shortlist.items.length} office spaces for ${shortlist.enquiry.companyName}`,
        html,
        replyTo: shortlist.advisor.email ?? undefined,
        attachments: [
          { filename: `PrimeDesk-Shortlist-v${shortlist.version}.pdf`, url: pdfUrl },
        ],
      });
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
