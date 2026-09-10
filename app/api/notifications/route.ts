import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: guard.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({
      where: { userId: guard.user.id, readAt: null },
    }),
  ]);
  return ok({ items, unread });
}

const readSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { ids, all } = readSchema.parse(await req.json().catch(() => ({})));
    await prisma.notification.updateMany({
      where: {
        userId: guard.user.id,
        readAt: null,
        ...(all ? {} : { id: { in: ids ?? [] } }),
      },
      data: { readAt: new Date() },
    });
    return ok({ marked: true });
  } catch (err) {
    return handleError(err);
  }
}
