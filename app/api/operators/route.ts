import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError } from "@/lib/api";
import { operatorSchema } from "@/lib/validators/operator";
import { serializeOperators } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const where: Prisma.OperatorWhereInput = {};
    if (sp.get("active") === "1") where.isActive = true;
    if (q) where.name = { contains: q, mode: "insensitive" };

    const operators = await prisma.operator.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        contacts: true,
        _count: { select: { spaces: true, deals: true } },
      },
    });
    return ok(serializeOperators(operators, guard.user.role));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth(['ADMIN','OPERATIONS']);
  if ("response" in guard) return guard.response;
  if (!["ADMIN", "OPERATIONS"].includes(guard.user.role))
    return ok({ error: "Forbidden" }, { status: 403 });

  try {
    const data = operatorSchema.parse(await req.json());
    const { contacts, ...fields } = data;
    const operator = await prisma.operator.create({
      data: {
        ...fields,
        website: fields.website || null,
        notes: fields.notes || null,
        contacts: contacts?.length
          ? {
              create: contacts.map((c) => ({
                ...c,
                designation: c.designation || null,
                email: c.email || null,
              })),
            }
          : undefined,
      },
      include: { contacts: true },
    });
    return ok(operator, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
