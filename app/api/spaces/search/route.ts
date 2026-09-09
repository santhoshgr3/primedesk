import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { matchSpaces } from "@/lib/services/match";

/** GET /api/spaces/search?enquiryId=… → spaces ranked by fit for that enquiry. */
export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const enquiryId = req.nextUrl.searchParams.get("enquiryId");
    if (!enquiryId) return fail("enquiryId is required", 400);

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });
    if (!enquiry) return fail("Enquiry not found", 404);

    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const matches = await matchSpaces(enquiry, { limit });
    return ok(matches);
  } catch (err) {
    return handleError(err);
  }
}
