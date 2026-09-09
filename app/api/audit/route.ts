import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";

export async function GET() {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN")
    return ok({ error: "Admins only" }, { status: 403 });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });
  return ok(logs);
}
