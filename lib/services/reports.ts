import { prisma } from "@/lib/prisma";

export function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export async function dashboardSnapshot() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ws = weekStart();
  const ms = monthStart();

  const [
    newToday,
    openDeals,
    wonMTD,
    shortlistsWeek,
    visitsWeek,
    visitsDoneWeek,
    dealsClosedMTD,
    byCity,
    byStatus,
  ] = await Promise.all([
    prisma.enquiry.count({ where: { createdAt: { gte: today }, isArchived: false } }),
    prisma.deal.findMany({
      where: { stage: { notIn: ["MOVED_IN", "LOST"] } },
      select: { monthlyValue: true, commissionValue: true },
    }),
    prisma.deal.aggregate({
      where: { stage: "MOVED_IN", movedInAt: { gte: ms } },
      _sum: { commissionValue: true, monthlyValue: true },
    }),
    prisma.shortlist.count({ where: { sentAt: { gte: ws } } }),
    prisma.visit.count({ where: { scheduledAt: { gte: ws } } }),
    prisma.visit.count({ where: { scheduledAt: { gte: ws }, status: "done" } }),
    prisma.deal.count({ where: { stage: "MOVED_IN", movedInAt: { gte: ms } } }),
    prisma.enquiry.groupBy({
      by: ["city"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    prisma.enquiry.groupBy({
      by: ["status"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
  ]);

  return {
    newToday,
    pipelineValue: openDeals.reduce((s, d) => s + d.monthlyValue, 0),
    pipelineCommission: openDeals.reduce((s, d) => s + (d.commissionValue ?? 0), 0),
    openDealCount: openDeals.length,
    revenueMTD: wonMTD._sum.commissionValue ?? 0,
    contractValueMTD: wonMTD._sum.monthlyValue ?? 0,
    shortlistsWeek,
    visitsWeek,
    visitsDoneWeek,
    dealsClosedMTD,
    byCity: byCity.map((r) => ({ city: r.city, count: r._count._all })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
  };
}

export async function leadSourceReport() {
  const enquiries = await prisma.enquiry.groupBy({
    by: ["source"],
    _count: { _all: true },
  });
  const wonBySource = await prisma.enquiry.groupBy({
    by: ["source"],
    where: { status: "CLOSED_WON" },
    _count: { _all: true },
  });
  const wonMap = new Map(wonBySource.map((r) => [r.source, r._count._all]));

  // Commission by source (join via deals→enquiry)
  const deals = await prisma.deal.findMany({
    where: { stage: "MOVED_IN" },
    select: { commissionValue: true, enquiry: { select: { source: true } } },
  });
  const commissionBySource = new Map<string, number>();
  for (const d of deals) {
    commissionBySource.set(
      d.enquiry.source,
      (commissionBySource.get(d.enquiry.source) ?? 0) + (d.commissionValue ?? 0),
    );
  }

  return enquiries
    .map((r) => {
      const total = r._count._all;
      const won = wonMap.get(r.source) ?? 0;
      return {
        source: r.source,
        enquiries: total,
        won,
        conversionPct: total ? Math.round((won / total) * 100) : 0,
        commission: commissionBySource.get(r.source) ?? 0,
      };
    })
    .sort((a, b) => b.enquiries - a.enquiries);
}

export async function advisorReport() {
  const advisors = await prisma.user.findMany({
    where: { role: { in: ["ADVISOR", "OPERATIONS"] } },
    select: { id: true, name: true },
  });

  const out = [];
  for (const a of advisors) {
    const [assigned, shortlists, visitsDone, won, revenue] = await Promise.all([
      prisma.enquiry.count({ where: { assignedToId: a.id } }),
      prisma.shortlist.count({ where: { advisorId: a.id, sentAt: { not: null } } }),
      prisma.visit.count({ where: { advisorId: a.id, status: "done" } }),
      prisma.deal.count({ where: { advisorId: a.id, stage: "MOVED_IN" } }),
      prisma.deal.aggregate({
        where: { advisorId: a.id, stage: "MOVED_IN" },
        _sum: { commissionValue: true },
      }),
    ]);
    out.push({
      advisor: a.name,
      assigned,
      shortlists,
      visitsDone,
      won,
      conversionPct: assigned ? Math.round((won / assigned) * 100) : 0,
      revenue: revenue._sum.commissionValue ?? 0,
    });
  }
  return out.sort((a, b) => b.revenue - a.revenue);
}

const FUNNEL_ORDER = [
  "NEW",
  "ADVISOR_ASSIGNED",
  "REQUIREMENT_CALL_DONE",
  "SHORTLIST_SENT",
  "VISIT_SCHEDULED",
  "VISIT_DONE",
  "NEGOTIATION",
  "CLOSED_WON",
] as const;

export async function funnelReport() {
  const grouped = await prisma.enquiry.groupBy({
    by: ["status"],
    where: { isArchived: false },
    _count: { _all: true },
  });
  const counts = new Map(grouped.map((r) => [r.status, r._count._all]));
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;

  // "Reached stage" = at this stage or beyond (using status history).
  const history = await prisma.enquiryStatusHistory.findMany({
    select: { enquiryId: true, toStatus: true },
  });
  const reached = new Map<string, Set<string>>();
  for (const h of history) {
    if (!reached.has(h.toStatus)) reached.set(h.toStatus, new Set());
    reached.get(h.toStatus)!.add(h.enquiryId);
  }

  return FUNNEL_ORDER.map((stage, i) => {
    const atStage = counts.get(stage) ?? 0;
    const reachedCount = reached.get(stage)?.size ?? atStage;
    const prevReached =
      i === 0
        ? total
        : reached.get(FUNNEL_ORDER[i - 1])?.size ?? reachedCount;
    return {
      stage,
      atStage,
      reached: reachedCount,
      dropOffPct:
        prevReached > 0
          ? Math.max(0, Math.round((1 - reachedCount / prevReached) * 100))
          : 0,
    };
  });
}

export async function pipelineReport() {
  const deals = await prisma.deal.groupBy({
    by: ["stage"],
    _count: { _all: true },
    _sum: { monthlyValue: true, commissionValue: true },
  });
  return deals.map((d) => ({
    stage: d.stage,
    count: d._count._all,
    value: d._sum.monthlyValue ?? 0,
    commission: d._sum.commissionValue ?? 0,
  }));
}

export async function operatorReport() {
  const operators = await prisma.operator.findMany({
    where: { isActive: true },
    select: { id: true, name: true, commissionRate: true },
  });
  const out = [];
  for (const o of operators) {
    const [shortlisted, won, revenue, spaces] = await Promise.all([
      prisma.shortlistItem.count({ where: { space: { operatorId: o.id } } }),
      prisma.deal.count({ where: { operatorId: o.id, stage: "MOVED_IN" } }),
      prisma.deal.aggregate({
        where: { operatorId: o.id, stage: "MOVED_IN" },
        _sum: { commissionValue: true },
      }),
      prisma.space.count({ where: { operatorId: o.id, isActive: true } }),
    ]);
    out.push({
      operator: o.name,
      commissionRate: o.commissionRate,
      spaces,
      timesShortlisted: shortlisted,
      dealsWon: won,
      revenue: revenue._sum.commissionValue ?? 0,
    });
  }
  return out.sort((a, b) => b.revenue - a.revenue);
}

export async function revenueReport() {
  const deals = await prisma.deal.findMany({
    where: { stage: "MOVED_IN" },
    select: { commissionValue: true, commissionStatus: true, movedInAt: true },
  });
  const byMonth = new Map<
    string,
    { pipeline: number; invoiced: number; received: number }
  >();
  for (const d of deals) {
    const key = (d.movedInAt ?? new Date()).toISOString().slice(0, 7);
    const row = byMonth.get(key) ?? { pipeline: 0, invoiced: 0, received: 0 };
    const v = d.commissionValue ?? 0;
    if (d.commissionStatus === "received") row.received += v;
    else if (d.commissionStatus === "invoiced") row.invoiced += v;
    else row.pipeline += v;
    byMonth.set(key, row);
  }
  const months = Array.from(byMonth.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const ytd = months
    .filter((m) => m.month.startsWith(String(new Date().getFullYear())))
    .reduce((s, m) => s + m.received + m.invoiced + m.pipeline, 0);

  return { months, ytd };
}

export async function workspaceDemandReport() {
  const [byType, bySeats] = await Promise.all([
    prisma.enquiry.groupBy({
      by: ["workspaceType"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    prisma.enquiry.groupBy({
      by: ["seatsNeeded"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
  ]);
  return {
    byType: byType.map((r) => ({ type: r.workspaceType, count: r._count._all })),
    bySeats: bySeats.map((r) => ({ range: r.seatsNeeded, count: r._count._all })),
  };
}

export async function lostDealReport() {
  const lost = await prisma.deal.findMany({
    where: { stage: "LOST" },
    select: { lostReason: true, stageHistory: true },
  });
  const byReason = new Map<string, number>();
  for (const d of lost) {
    const r = d.lostReason || "unspecified";
    byReason.set(r, (byReason.get(r) ?? 0) + 1);
  }
  return {
    total: lost.length,
    byReason: Array.from(byReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}
