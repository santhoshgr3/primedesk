import type { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";

/** Create (or return) a public client-facing link for the shortlist. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
    });
    if (!shortlist) return fail("Not found", 404);

    let token = shortlist.shareToken;
    if (!token) {
      token = crypto.randomBytes(12).toString("base64url");
      await prisma.shortlist.update({
        where: { id: params.id },
        data: { shareToken: token },
      });
      await logActivity(
        shortlist.enquiryId,
        "note",
        `Client link generated for shortlist v${shortlist.version}`,
        guard.user.id,
      );
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return ok({ token, url: `${base}/s/${token}` });
  } catch (err) {
    return handleError(err);
  }
}
