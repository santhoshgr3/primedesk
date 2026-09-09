import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { logActivity } from "@/lib/services/enquiry";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const activities = await prisma.activity.findMany({
      where: { enquiryId: params.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(activities);
  } catch (err) {
    return handleError(err);
  }
}

const noteSchema = z.object({
  type: z
    .enum(["note", "call", "whatsapp", "email"])
    .default("note"),
  description: z.string().min(1),
  outcome: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const { type, description, outcome } = noteSchema.parse(await req.json());
    await logActivity(params.id, type, description, guard.user.id, outcome);
    const activities = await prisma.activity.findMany({
      where: { enquiryId: params.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(activities, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
