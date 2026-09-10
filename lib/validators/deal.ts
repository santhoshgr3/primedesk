import { z } from "zod";

export const dealStageEnum = z.enum([
  "REQUIREMENT_QUALIFIED",
  "SHORTLIST_ACCEPTED",
  "VISIT_DONE",
  "NEGOTIATING_TERMS",
  "DOCUMENTATION",
  "LEASE_SIGNED",
  "MOVED_IN",
  "LOST",
]);

export const createDealSchema = z.object({
  enquiryId: z.string().min(1),
  spaceId: z.string().min(1),
  advisorId: z.string().optional(),
  seats: z.coerce.number().int().positive(),
  pricePerSeat: z.coerce.number().positive(),
  lockInMonths: z.coerce.number().int().min(0).optional(),
  depositPaid: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  stage: dealStageEnum.optional(),
});

export const updateDealSchema = z.object({
  seats: z.coerce.number().int().positive().optional(),
  pricePerSeat: z.coerce.number().positive().optional(),
  lockInMonths: z.coerce.number().int().min(0).optional(),
  depositPaid: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  commissionStatus: z.enum(["pending", "invoiced", "received"]).optional(),
  isCoBroker: z.boolean().optional(),
  coBrokerName: z.string().optional(),
  coBrokerSplit: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
  expectedVersion: z.number().int().optional(), // optimistic-concurrency guard
});

export const moveStageSchema = z.object({
  stage: dealStageEnum,
  lostReason: z.string().optional(),
});
