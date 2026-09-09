import { z } from "zod";

export const operatorContactSchema = z.object({
  name: z.string().min(1),
  designation: z.string().optional().or(z.literal("")),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  isPrimary: z.boolean().optional().default(false),
});

export const operatorSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  type: z.enum(["national_chain", "regional", "independent"]).default("independent"),
  website: z.string().url().optional().or(z.literal("")),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
  contacts: z.array(operatorContactSchema).optional().default([]),
});

export const updateOperatorSchema = operatorSchema.partial();

export type OperatorInput = z.infer<typeof operatorSchema>;
