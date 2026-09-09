import { z } from "zod";

export const createShortlistSchema = z.object({
  enquiryId: z.string().min(1),
  items: z
    .array(
      z.object({
        spaceId: z.string().min(1),
        advisorNote: z.string().optional().or(z.literal("")),
        rank: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Pick at least one space")
    .max(6, "A shortlist holds at most 6 spaces"),
});

export const sendShortlistSchema = z.object({
  via: z.array(z.enum(["whatsapp", "email"])).min(1),
});

export const shortlistResponseSchema = z.object({
  response: z.enum([
    "interested_in_X",
    "wants_visit",
    "no_response",
    "not_suitable",
  ]),
  clientNote: z.string().optional().or(z.literal("")),
  preferredSpaceIds: z.array(z.string()).optional().default([]),
});
