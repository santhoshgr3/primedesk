import type { NextRequest } from "next/server";

/**
 * Guards /api/cron/* endpoints. Accepts either:
 *  - Authorization: Bearer <CRON_SECRET>
 *  - Vercel Cron's `x-vercel-cron` header (any value) when no secret is set
 */
export function authorizeCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (secret) return header === `Bearer ${secret}`;
  return (
    req.headers.has("x-vercel-cron") ||
    process.env.NODE_ENV !== "production"
  );
}
