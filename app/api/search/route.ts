import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";

/** Global search across enquiries, operators and spaces (topbar). */
export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return ok({ enquiries: [], operators: [], spaces: [] });
    }
    const like = { contains: q, mode: "insensitive" as const };
    const digits = q.replace(/\D/g, "");

    const [enquiries, operators, spaces] = await Promise.all([
      prisma.enquiry.findMany({
        where: {
          isArchived: false,
          OR: [
            { companyName: like },
            { contactName: like },
            ...(digits.length >= 4
              ? [{ contactPhone: { contains: digits } }]
              : []),
          ],
        },
        take: 6,
        orderBy: { lastActivityAt: "desc" },
        select: {
          id: true,
          companyName: true,
          contactName: true,
          city: true,
          status: true,
          priority: true,
        },
      }),
      prisma.operator.findMany({
        where: { name: like },
        take: 4,
        select: { id: true, name: true, type: true },
      }),
      prisma.space.findMany({
        where: {
          isActive: true,
          OR: [{ name: like }, { microMarket: like }, { building: like }],
        },
        take: 6,
        select: {
          id: true,
          name: true,
          city: true,
          microMarket: true,
          availableSeats: true,
          operatorId: true,
          operator: { select: { name: true } },
        },
      }),
    ]);

    return ok({ enquiries, operators, spaces });
  } catch (err) {
    return handleError(err);
  }
}
