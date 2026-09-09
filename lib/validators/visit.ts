import { z } from "zod";

export const createVisitSchema = z.object({
  enquiryId: z.string().min(1),
  spaceId: z.string().min(1),
  advisorId: z.string().optional(),
  scheduledAt: z.coerce.date(),
  type: z.enum(["physical", "virtual", "video_walkthrough"]).default("physical"),
  operatorContact: z.string().optional().or(z.literal("")),
});

export const updateVisitSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  type: z.enum(["physical", "virtual", "video_walkthrough"]).optional(),
  status: z
    .enum([
      "scheduled",
      "confirmed",
      "done",
      "no_show",
      "cancelled",
      "rescheduled",
    ])
    .optional(),
  operatorContact: z.string().optional(),
});

export const visitOutcomeSchema = z.object({
  outcome: z.enum(["interested", "not_interested", "needs_another", "revisit"]),
  clientFeedback: z.string().optional().or(z.literal("")),
  nextStep: z.string().optional().or(z.literal("")),
  createDeal: z.boolean().optional().default(false),
});
