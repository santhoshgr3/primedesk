import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, handleError, parsePagination } from "@/lib/api";
import { spaceSchema } from "@/lib/validators/space";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  try {
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, pageSize } = parsePagination(sp);

    const where: Prisma.SpaceWhereInput = { isActive: true };
    const q = sp.get("q")?.trim();
    if (q) where.name = { contains: q, mode: "insensitive" };
    for (const key of ["city", "microMarket", "workspaceType", "status"] as const) {
      const v = sp.get(key);
      if (v) (where as Record<string, unknown>)[key] = v;
    }
    if (sp.get("operatorId")) where.operatorId = sp.get("operatorId")!;
    const minSeats = sp.get("minSeats");
    if (minSeats) where.availableSeats = { gte: Number(minSeats) };
    const maxPrice = sp.get("maxPrice");
    if (maxPrice) where.pricePerSeat = { lte: Number(maxPrice) };

    const [total, rows] = await Promise.all([
      prisma.space.count({ where }),
      prisma.space.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: {
          operator: { select: { id: true, name: true } },
          _count: { select: { shortlistItems: true, visits: true, deals: true } },
        },
      }),
    ]);
    return ok({ rows, total, page, pageSize });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (!["ADMIN", "OPERATIONS"].includes(guard.user.role))
    return ok({ error: "Forbidden" }, { status: 403 });

  try {
    const data = spaceSchema.parse(await req.json());
    const space = await prisma.space.create({
      data: {
        ...data,
        floor: data.floor || null,
        building: data.building || null,
        brochureUrl: data.brochureUrl || null,
        virtualTourUrl: data.virtualTourUrl || null,
        lastVerifiedAt: new Date(),
      },
    });
    return ok(space, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
