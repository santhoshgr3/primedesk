import { z } from "zod";

export const enquiryStatusEnum = z.enum([
  "NEW",
  "ADVISOR_ASSIGNED",
  "REQUIREMENT_CALL_DONE",
  "SHORTLIST_SENT",
  "VISIT_SCHEDULED",
  "VISIT_DONE",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
  "PAUSED",
]);

export const workspaceTypeEnum = z.enum([
  "MANAGED_OFFICE",
  "COWORKING",
  "PLUG_AND_PLAY",
  "CUSTOMIZED",
  "GCC_ENTERPRISE",
  "NOT_SURE",
]);

export const enquirySourceEnum = z.enum([
  "WEBSITE_FORM",
  "WHATSAPP_INBOUND",
  "LINKEDIN",
  "FACEBOOK_ADS",
  "INSTAGRAM_ADS",
  "GOOGLE_ADS",
  "REFERRAL",
  "COLD_CALL",
  "DIRECT_CALL",
  "WALK_IN",
  "OTHER",
]);

/** Quick-add — the minimal fields to capture a fast inbound lead. */
export const quickEnquirySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(6, "Valid phone required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  seatsNeeded: z.string().min(1),
  city: z.string().min(1),
  workspaceType: workspaceTypeEnum.default("NOT_SURE"),
  source: enquirySourceEnum.default("OTHER"),
  assignedToId: z.string().optional().or(z.literal("")),
});

/** Full requirement — filled after the requirement call. */
export const fullEnquirySchema = quickEnquirySchema.extend({
  industry: z.string().optional().or(z.literal("")),
  companySize: z.coerce.number().int().positive().optional(),
  contactDesig: z.string().optional().or(z.literal("")),
  microMarket: z.string().optional().or(z.literal("")),
  budgetPerSeat: z.coerce.number().positive().optional(),
  moveInTimeline: z.string().optional().or(z.literal("")),
  amenityPriority: z.array(z.string()).optional().default([]),
  priority: z.enum(["hot", "warm", "cold"]).default("warm"),
  notes: z.string().optional().or(z.literal("")),
});

export const updateEnquirySchema = fullEnquirySchema.partial().extend({
  status: enquiryStatusEnum.optional(),
});

export const assignSchema = z.object({
  assignedToId: z.string().min(1),
});

export const statusChangeSchema = z.object({
  status: enquiryStatusEnum,
  note: z.string().optional(),
});

export type QuickEnquiryInput = z.infer<typeof quickEnquirySchema>;
export type FullEnquiryInput = z.infer<typeof fullEnquirySchema>;
