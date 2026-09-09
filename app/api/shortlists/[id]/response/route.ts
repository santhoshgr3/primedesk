import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { shortlistResponseSchema } from "@/lib/validators/shortlist";
import { logActivity } from "@/lib/services/enquiry";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { response, clientNote, preferredSpaceIds } =
      shortlistResponseSchema.parse(await req.json());

    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
    });
    if (!shortlist) return fail("Not found", 404);

    await prisma.shortlist.update({
      where: { id: params.id },
      data: {
        response,
        clientNote:
          clientNote ||
          (preferredSpaceIds.length
            ? `Preferred: ${preferredSpaceIds.length} space(s)`
            : null),
      },
    });

    await logActivity(
      shortlist.enquiryId,
      "note",
      `Client responded to shortlist v${shortlist.version}: ${response.replace(
        /_/g,
        " ",
      )}`,
      guard.user.id,
    );

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
