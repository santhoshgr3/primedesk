import type { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { reassignFromAdvisor } from "@/lib/services/assignment";
import { writeAudit } from "@/lib/services/audit";

const schema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "ADVISOR", "OPERATIONS", "MARKETING"]).optional(),
  city: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN") return fail("Admins only", 403);

  try {
    const data = schema.parse(await req.json());
    const { password, ...rest } = data;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
      select: { id: true, name: true, role: true, isActive: true },
    });

    let reassigned = 0;
    if (rest.isActive === false) {
      reassigned = await reassignFromAdvisor(params.id, guard.user.id);
    }

    await writeAudit(guard.user.id, "team.update", `user:${params.id}`, {
      reassigned,
    });
    return ok({ user, reassigned });
  } catch (err) {
    return handleError(err);
  }
}
