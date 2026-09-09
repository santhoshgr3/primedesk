import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

/**
 * Pick the advisor for a new enquiry per the configured assignment mode
 * (PLAN Module 10): manual / round-robin / city-based routing.
 * Returns null when mode is manual or no eligible advisor exists.
 */
export async function pickAdvisor(city: string): Promise<string | null> {
  const settings = await getSettings();
  if (settings.assignment.mode === "manual") return null;

  const baseWhere = { isActive: true, role: "ADVISOR" as const };

  if (settings.assignment.mode === "city_based") {
    const cityAdvisor = await prisma.user.findFirst({
      where: { ...baseWhere, city },
      orderBy: [{ lastAssignedAt: "asc" }, { createdAt: "asc" }],
    });
    if (cityAdvisor) {
      await touch(cityAdvisor.id);
      return cityAdvisor.id;
    }
  }

  // round-robin (also the fallback for city_based with no city match)
  const next = await prisma.user.findFirst({
    where: baseWhere,
    orderBy: [{ lastAssignedAt: "asc" }, { createdAt: "asc" }],
  });
  if (!next) return null;
  await touch(next.id);
  return next.id;
}

async function touch(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastAssignedAt: new Date() },
  });
}

/** Reassign all open enquiries away from an advisor going out-of-office. */
export async function reassignFromAdvisor(advisorId: string, actorId: string) {
  const open = await prisma.enquiry.findMany({
    where: {
      assignedToId: advisorId,
      status: { notIn: ["CLOSED_WON", "CLOSED_LOST", "PAUSED"] },
      isArchived: false,
    },
  });
  let moved = 0;
  for (const e of open) {
    const to = await pickAdvisor(e.city);
    if (!to || to === advisorId) continue;
    await prisma.enquiry.update({
      where: { id: e.id },
      data: { assignedToId: to, lastActivityAt: new Date() },
    });
    await prisma.activity.create({
      data: {
        enquiryId: e.id,
        type: "note",
        description: "Auto-reassigned (advisor unavailable)",
        performedBy: actorId,
      },
    });
    moved++;
  }
  return moved;
}
