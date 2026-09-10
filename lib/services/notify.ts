import { prisma } from "@/lib/prisma";

export type NotifyInput = {
  type:
    | "assigned"
    | "new_lead"
    | "shortlist_response"
    | "task_escalation"
    | "deal_won"
    | "visit_reminder";
  title: string;
  body?: string;
  link?: string;
};

/** Create an in-app notification for a user. Never throws. */
export async function notify(userId: string | null | undefined, input: NotifyInput) {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

export async function notifyMany(userIds: string[], input: NotifyInput) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  try {
    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifyMany] failed", err);
  }
}
