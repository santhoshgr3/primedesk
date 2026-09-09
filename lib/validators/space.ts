import { z } from "zod";
import { workspaceTypeEnum } from "./enquiry";

export const spaceSchema = z.object({
  operatorId: z.string().min(1, "Operator is required"),
  name: z.string().min(1, "Space name is required"),
  city: z.string().min(1),
  microMarket: z.string().min(1),
  address: z.string().min(1),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  workspaceType: workspaceTypeEnum.default("MANAGED_OFFICE"),
  totalSeats: z.coerce.number().int().positive(),
  availableSeats: z.coerce.number().int().min(0),
  areaSqft: z.coerce.number().positive().optional(),
  floor: z.string().optional().or(z.literal("")),
  building: z.string().optional().or(z.literal("")),
  pricePerSeat: z.coerce.number().positive(),
  lockInMonths: z.coerce.number().int().min(0).optional(),
  depositMonths: z.coerce.number().int().min(0).optional(),
  includedItems: z.array(z.string()).optional().default([]),
  addOnItems: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  brochureUrl: z.string().url().optional().or(z.literal("")),
  virtualTourUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "full", "waitlisted", "inactive"]).default("active"),
  moveInReady: z.enum(["ready", "2_weeks", "1_month"]).default("ready"),
  amenities: z.array(z.string()).optional().default([]),
});

export const updateSpaceSchema = spaceSchema.partial();

export type SpaceInput = z.infer<typeof spaceSchema>;
