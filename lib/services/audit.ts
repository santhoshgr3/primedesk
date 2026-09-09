import { prisma } from "@/lib/prisma";

export async function writeAudit(
  userId: string | null,
  action: string,
  entity?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity: entity ?? null,
        meta: (meta as never) ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write", err);
  }
}
