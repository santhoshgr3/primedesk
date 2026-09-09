import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, fail, handleError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;

  const month =
    req.nextUrl.searchParams.get("month") ??
    new Date().toISOString().slice(0, 7);

  const targets = await prisma.advisorTarget.findMany({
    where: { month },
    include: { advisor: { select: { id: true, name: true } } },
  });

  // Actuals for the month
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const withActuals = await Promise.all(
    targets.map(async (t) => {
      const [shortlists, visits, deals, revenue] = await Promise.all([
        prisma.shortlist.count({
          where: {
            advisorId: t.advisorId,
            sentAt: { gte: start, lt: end },
          },
        }),
        prisma.visit.count({
          where: {
            advisorId: t.advisorId,
            status: "done",
            scheduledAt: { gte: start, lt: end },
          },
        }),
        prisma.deal.count({
          where: {
            advisorId: t.advisorId,
            stage: "MOVED_IN",
            movedInAt: { gte: start, lt: end },
          },
        }),
        prisma.deal.aggregate({
          where: {
            advisorId: t.advisorId,
            stage: "MOVED_IN",
            movedInAt: { gte: start, lt: end },
          },
          _sum: { commissionValue: true },
        }),
      ]);
      return {
        ...t,
        actual: {
          shortlists,
          visits,
          deals,
          revenue: revenue._sum.commissionValue ?? 0,
        },
      };
    }),
  );

  return ok(withActuals);
}

const schema = z.object({
  advisorId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  shortlistsGoal: z.coerce.number().int().min(0).default(0),
  visitsGoal: z.coerce.number().int().min(0).default(0),
  dealsGoal: z.coerce.number().int().min(0).default(0),
  revenueGoal: z.coerce.number().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const guard = await withAuth();
  if ("response" in guard) return guard.response;
  if (guard.user.role !== "ADMIN") return fail("Admins only", 403);

  try {
    const data = schema.parse(await req.json());
    const target = await prisma.advisorTarget.upsert({
      where: {
        advisorId_month: { advisorId: data.advisorId, month: data.month },
      },
      create: data,
      update: data,
    });
    return ok(target, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
