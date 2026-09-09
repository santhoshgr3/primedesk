import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const role = req.nextUrl.searchParams.get("role") ?? undefined;
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(role ? { role: role as never } : {}),
      },
      select: { id: true, name: true, email: true, role: true, city: true },
      orderBy: { name: "asc" },
    });
    return ok(users);
  } catch (err) {
    return handleError(err);
  }
}
