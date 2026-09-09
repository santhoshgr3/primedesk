import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { writeAudit } from "@/lib/services/audit";

export async function GET() {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return ok(templates);
}

const schema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "sms"]).default("whatsapp"),
  body: z.string().min(1),
  approved: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (!["ADMIN", "MARKETING"].includes(guard.user.role))
    return fail("Forbidden", 403);

  try {
    const data = schema.parse(await req.json());
    const tpl = await prisma.messageTemplate.upsert({
      where: { key: data.key },
      create: data,
      update: data,
    });
    await writeAudit(guard.user.id, "template.upsert", `template:${data.key}`);
    return ok(tpl, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
