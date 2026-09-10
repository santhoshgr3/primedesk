import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";
import { resolveShareToken, SHARE_MESSAGES } from "@/lib/services/shortlist-access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/services/notify";

/** Public — no auth. The client's browser reads the shortlist by token. */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const limited = enforceRateLimit(req, "pub:sl:get", {
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const { state, shortlist } = await resolveShareToken(params.token);
    if (!shortlist) return fail(SHARE_MESSAGES[state as "not_found"], 404);

    if (!shortlist.viewedAt) {
      await prisma.shortlist.update({
        where: { id: shortlist.id },
        data: { viewedAt: new Date() },
      });
      await logActivity(
        shortlist.enquiryId,
        "note",
        `Client opened the shared shortlist (v${shortlist.version})`,
        "system",
      );
    }

    return ok(shortlist);
  } catch (err) {
    return handleError(err);
  }
}

const bodySchema = z.object({
  preferredSpaceIds: z.array(z.string()).max(6),
  note: z.string().max(2000).optional(),
  wantsVisit: z.boolean().optional().default(false),
});

/** Public — the client submits their picks. */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const limited = enforceRateLimit(req, "pub:sl:post", {
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const { preferredSpaceIds, note, wantsVisit } = bodySchema.parse(
      await req.json(),
    );

    const { state, shortlist } = await resolveShareToken(params.token);
    if (!shortlist) return fail(SHARE_MESSAGES[state as "not_found"], 404);

    await prisma.$transaction([
      prisma.shortlistItem.updateMany({
        where: { shortlistId: shortlist.id },
        data: { clientPreferred: false },
      }),
      prisma.shortlistItem.updateMany({
        where: { shortlistId: shortlist.id, spaceId: { in: preferredSpaceIds } },
        data: { clientPreferred: true },
      }),
      prisma.shortlist.update({
        where: { id: shortlist.id },
        data: {
          response: wantsVisit
            ? "wants_visit"
            : preferredSpaceIds.length
              ? "interested_in_X"
              : "not_suitable",
          clientNote: note || null,
        },
      }),
    ]);

    const picked = shortlist.items.filter((i) =>
      preferredSpaceIds.includes(i.spaceId),
    ).length;

    await logActivity(
      shortlist.enquiryId,
      "note",
      `Client responded via shared link — ${picked} space(s) preferred${
        wantsVisit ? ", wants a visit" : ""
      }${note ? `: "${note}"` : ""}`,
      "system",
    );

    await prisma.task.create({
      data: {
        type: wantsVisit ? "SITE_VISIT" : "FOLLOW_UP",
        title: wantsVisit
          ? `${shortlist.enquiry.companyName}: client wants a visit — coordinate`
          : `${shortlist.enquiry.companyName}: client picked ${picked} space(s) — follow up`,
        dueDate: new Date(Date.now() + 4 * 3600 * 1000),
        enquiryId: shortlist.enquiryId,
        assignedToId: shortlist.advisorId,
        priority: "HIGH",
      },
    });

    await notify(shortlist.advisorId, {
      type: "shortlist_response",
      title: `${shortlist.enquiry.companyName} responded to the shortlist`,
      body: wantsVisit
        ? `Wants a visit · ${picked} space(s) preferred`
        : `${picked} space(s) preferred`,
      link: `/enquiries/${shortlist.enquiryId}`,
    });

    return ok({ received: true });
  } catch (err) {
    return handleError(err);
  }
}
