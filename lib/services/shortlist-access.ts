import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type ShareState = "ok" | "not_found" | "revoked" | "expired";

const includeFull = {
  enquiry: { select: { companyName: true, contactName: true, city: true } },
  advisor: { select: { name: true, phone: true, email: true } },
  items: {
    orderBy: { rank: "asc" as const },
    include: { space: { include: { operator: { select: { name: true } } } } },
  },
} satisfies Prisma.ShortlistInclude;

/** Resolve a public share token, enforcing revocation + expiry. */
export async function resolveShareToken(token: string) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { shareToken: token },
    include: includeFull,
  });

  if (!shortlist) return { state: "not_found" as ShareState, shortlist: null };
  if (shortlist.shareRevoked)
    return { state: "revoked" as ShareState, shortlist: null };
  if (shortlist.shareExpiresAt && shortlist.shareExpiresAt < new Date())
    return { state: "expired" as ShareState, shortlist: null };

  return { state: "ok" as ShareState, shortlist };
}

export const SHARE_MESSAGES: Record<Exclude<ShareState, "ok">, string> = {
  not_found: "This link is not valid.",
  revoked: "This link has been turned off by your advisor.",
  expired: "This link has expired — ask your advisor for a fresh one.",
};
