import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: params.id },
      include: {
        enquiry: true,
        advisor: { select: { name: true, email: true, phone: true } },
        items: {
          orderBy: { rank: "asc" },
          include: { space: { include: { operator: true } } },
        },
      },
    });
    if (!shortlist) return fail("Not found", 404);
    return ok(shortlist);
  } catch (err) {
    return handleError(err);
  }
}
