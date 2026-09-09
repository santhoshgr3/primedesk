import type { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";

const SHARE_TTL_DAYS = 30;

/** Create (or return) a public client-facing link for the shortlist. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(["ADMIN", "ADVISOR"]);
  if ("response" in guard) return guard.response;

  try {
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
    });
    if (!shortlist) return fail("Not found", 404);

    const expiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 86400000);
    let token = shortlist.shareToken;

    if (!token || shortlist.shareRevoked) {
      token = crypto.randomBytes(12).toString("base64url");
      await prisma.shortlist.update({
        where: { id: params.id },
        data: {
          shareToken: token,
          shareExpiresAt: expiresAt,
          shareRevoked: false,
        },
      });
      await logActivity(
        shortlist.enquiryId,
        "note",
        `Client link generated for shortlist v${shortlist.version}`,
        guard.user.id,
      );
    } else {
      await prisma.shortlist.update({
        where: { id: params.id },
        data: { shareExpiresAt: expiresAt },
      });
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return ok({
      token,
      url: `${base}/s/${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}

/** Revoke the public link. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth(["ADMIN", "ADVISOR"]);
  if ("response" in guard) return guard.response;

  try {
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
    });
    if (!shortlist) return fail("Not found", 404);

    await prisma.shortlist.update({
      where: { id: params.id },
      data: { shareRevoked: true },
    });
    await logActivity(
      shortlist.enquiryId,
      "note",
      `Client link revoked for shortlist v${shortlist.version}`,
      guard.user.id,
    );
    return ok({ revoked: true });
  } catch (err) {
    return handleError(err);
  }
}
