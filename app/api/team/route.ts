import type { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";
import { writeAudit } from "@/lib/services/audit";

export async function GET() {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      city: true,
      isActive: true,
      phone: true,
    },
  });
  return ok(users);
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "ADVISOR", "OPERATIONS", "MARKETING"]).default("ADVISOR"),
  city: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN") return fail("Admins only", 403);

  try {
    const data = schema.parse(await req.json());
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) return fail("Email already in use", 409);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        city: data.city || null,
        passwordHash: await bcrypt.hash(data.password, 10),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    await writeAudit(guard.user.id, "team.create", `user:${user.id}`);
    return ok(user, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
