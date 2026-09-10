import { prisma } from "@/lib/prisma";
import type { EnquiryStatus, Prisma, WorkspaceType, EnquirySource } from "@prisma/client";
import { pickAdvisor } from "@/lib/services/assignment";
import { getSettings } from "@/lib/settings";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { scoreEnquiry } from "@/lib/services/scoring";
import { notify } from "@/lib/services/notify";

/**
 * Auto-task rules — every status transition should leave the enquiry with a
 * scheduled next action so nothing falls through the cracks (PLAN Module 6).
 */
const AUTO_TASK_ON_STATUS: Partial<
  Record<
    EnquiryStatus,
    { title: string; type: Prisma.TaskCreateInput["type"]; dueInHours: number }
  >
> = {
  NEW: { title: "Call new enquiry within 2 hours", type: "CALL", dueInHours: 2 },
  ADVISOR_ASSIGNED: {
    title: "Make requirement call",
    type: "CALL",
    dueInHours: 4,
  },
  REQUIREMENT_CALL_DONE: {
    title: "Build & send shortlist within 24 hours",
    type: "WHATSAPP",
    dueInHours: 24,
  },
  SHORTLIST_SENT: {
    title: "Follow up if no response in 24 hours",
    type: "FOLLOW_UP",
    dueInHours: 24,
  },
  VISIT_SCHEDULED: {
    title: "Confirm visit logistics with client & operator",
    type: "WHATSAPP",
    dueInHours: 12,
  },
  VISIT_DONE: {
    title: "Capture visit feedback & next step",
    type: "CALL",
    dueInHours: 6,
  },
  NEGOTIATION: {
    title: "Progress negotiation / send revised terms",
    type: "CALL",
    dueInHours: 24,
  },
};

export async function logActivity(
  enquiryId: string,
  type: string,
  description: string,
  performedBy: string,
  outcome?: string,
) {
  await prisma.activity.create({
    data: { enquiryId, type, description, performedBy, outcome },
  });
  await prisma.enquiry.update({
    where: { id: enquiryId },
    data: { lastActivityAt: new Date() },
  });
}

export async function changeStatus(
  enquiryId: string,
  toStatus: EnquiryStatus,
  userId: string,
  note?: string,
) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) throw new Error("Enquiry not found");
  if (enquiry.status === toStatus) return enquiry;

  const updated = await prisma.$transaction(async (tx) => {
    const e = await tx.enquiry.update({
      where: { id: enquiryId },
      data: { status: toStatus, lastActivityAt: new Date() },
    });

    await tx.enquiryStatusHistory.create({
      data: {
        enquiryId,
        fromStatus: enquiry.status,
        toStatus,
        changedBy: userId,
        note,
      },
    });

    await tx.activity.create({
      data: {
        enquiryId,
        type: "status_change",
        description: `Status changed ${enquiry.status} → ${toStatus}${
          note ? ` — ${note}` : ""
        }`,
        performedBy: userId,
      },
    });

    const rule = AUTO_TASK_ON_STATUS[toStatus];
    if (rule && enquiry.assignedToId) {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + rule.dueInHours);
      await tx.task.create({
        data: {
          type: rule.type,
          title: rule.title,
          dueDate,
          enquiryId,
          assignedToId: enquiry.assignedToId,
          priority: rule.dueInHours <= 4 ? "URGENT" : "HIGH",
        },
      });
    }

    return e;
  });

  // Engagement changed — recompute the lead score.
  await scoreEnquiry(enquiryId).catch(() => {});

  return updated;
}

type InboundInput = {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  seatsNeeded: string;
  city: string;
  microMarket?: string | null;
  workspaceType?: WorkspaceType;
  budgetPerSeat?: number | null;
  moveInTimeline?: string | null;
  notes?: string | null;
  source: EnquirySource;
  metaLeadId?: string | null;
};

/**
 * Create an enquiry from an inbound channel (website form, Meta Lead Ads,
 * WhatsApp) — applies auto-assignment, the welcome WhatsApp, and the
 * first-call SLA task. Idempotent on `metaLeadId`.
 */
export async function createInboundEnquiry(input: InboundInput) {
  if (input.metaLeadId) {
    const existing = await prisma.enquiry.findUnique({
      where: { metaLeadId: input.metaLeadId },
    });
    if (existing) return existing;
  }

  const settings = await getSettings();
  const assignedToId = settings.assignment.autoAssignInbound
    ? await pickAdvisor(input.city)
    : null;

  const enquiry = await prisma.enquiry.create({
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail || null,
      seatsNeeded: input.seatsNeeded,
      city: input.city,
      microMarket: input.microMarket || null,
      workspaceType: input.workspaceType ?? "NOT_SURE",
      budgetPerSeat: input.budgetPerSeat ?? null,
      moveInTimeline: input.moveInTimeline || null,
      notes: input.notes || null,
      source: input.source,
      metaLeadId: input.metaLeadId || null,
      status: assignedToId ? "ADVISOR_ASSIGNED" : "NEW",
      assignedToId,
      priority: "warm",
      lastActivityAt: new Date(),
      activities: {
        create: {
          type: "note",
          description: `Enquiry created from ${input.source.replace(/_/g, " ").toLowerCase()}`,
          performedBy: "system",
        },
      },
    },
  });

  if (assignedToId) {
    const due = new Date();
    due.setHours(due.getHours() + settings.sla.firstCallHours);
    await prisma.task.create({
      data: {
        type: "CALL",
        title: `Call ${enquiry.companyName} within ${settings.sla.firstCallHours} hours`,
        dueDate: due,
        enquiryId: enquiry.id,
        assignedToId,
        priority: "URGENT",
      },
    });
  }

  await sendWhatsAppTemplate({
    to: enquiry.contactPhone,
    templateKey: "welcome_enquiry",
    variables: { name: enquiry.contactName },
  });
  await prisma.message.create({
    data: {
      enquiryId: enquiry.id,
      channel: "whatsapp",
      direction: "outbound",
      content: `Welcome message sent to ${enquiry.contactName}`,
      templateId: "welcome_enquiry",
    },
  });

  await scoreEnquiry(enquiry.id).catch(() => {});

  if (assignedToId) {
    await notify(assignedToId, {
      type: "new_lead",
      title: `New lead: ${enquiry.companyName}`,
      body: `${enquiry.seatsNeeded} seats · ${enquiry.city} · via ${input.source
        .replace(/_/g, " ")
        .toLowerCase()}`,
      link: `/enquiries/${enquiry.id}`,
    });
  }

  return enquiry;
}

export async function assignAdvisor(
  enquiryId: string,
  advisorId: string,
  actorId: string,
) {
  const enquiry = await prisma.enquiry.update({
    where: { id: enquiryId },
    data: {
      assignedToId: advisorId,
      status: "ADVISOR_ASSIGNED",
      lastActivityAt: new Date(),
    },
    include: { assignedTo: { select: { name: true } } },
  });

  await prisma.activity.create({
    data: {
      enquiryId,
      type: "note",
      description: `Assigned to ${enquiry.assignedTo?.name ?? "advisor"}`,
      performedBy: actorId,
    },
  });

  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + 4);
  await prisma.task.create({
    data: {
      type: "CALL",
      title: "Make requirement call",
      dueDate,
      enquiryId,
      assignedToId: advisorId,
      priority: "HIGH",
    },
  });

  if (advisorId !== actorId) {
    await notify(advisorId, {
      type: "assigned",
      title: `You were assigned ${enquiry.companyName}`,
      body: `${enquiry.seatsNeeded} seats · ${enquiry.city}`,
      link: `/enquiries/${enquiryId}`,
    });
  }

  return enquiry;
}
