import Link from "next/link";
import {
  ClipboardList,
  TrendingUp,
  IndianRupee,
  FileText,
  CalendarCheck,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { formatINR, ageLabel, timeAgo, titleCase } from "@/lib/utils";
import { CITIES, ENQUIRY_STATUS_META } from "@/lib/constants";
import { requireUser } from "@/lib/session";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdvisor = user.role === "ADVISOR" || user.role === "OPERATIONS";
  const today = startOfDay();
  const weekStart = startOfWeek();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const myDay = isAdvisor
    ? await Promise.all([
        prisma.task.findMany({
          where: {
            assignedToId: user.id,
            status: "pending",
            dueDate: { lte: endOfToday },
          },
          orderBy: { dueDate: "asc" },
          take: 12,
          include: { enquiry: { select: { id: true, companyName: true } } },
        }),
        prisma.enquiry.findMany({
          where: {
            assignedToId: user.id,
            isArchived: false,
            status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
          },
          orderBy: [{ score: "desc" }, { lastActivityAt: "desc" }],
          take: 6,
          select: {
            id: true,
            companyName: true,
            city: true,
            status: true,
            score: true,
            priority: true,
          },
        }),
      ])
    : null;

  const [
    newToday,
    openDeals,
    monthWon,
    shortlistsWeek,
    visitsWeek,
    visitsDoneWeek,
    dealsClosedMTD,
    byCity,
    recentEnquiries,
  ] = await Promise.all([
    prisma.enquiry.count({
      where: { createdAt: { gte: today }, isArchived: false },
    }),
    prisma.deal.findMany({
      where: { stage: { notIn: ["MOVED_IN", "LOST"] } },
      select: { monthlyValue: true, commissionValue: true },
    }),
    prisma.deal.aggregate({
      where: { stage: "MOVED_IN", updatedAt: { gte: monthStart } },
      _sum: { commissionValue: true },
    }),
    prisma.shortlist.count({ where: { sentAt: { gte: weekStart } } }),
    prisma.visit.count({ where: { scheduledAt: { gte: weekStart } } }),
    prisma.visit.count({
      where: { scheduledAt: { gte: weekStart }, status: "done" },
    }),
    prisma.deal.count({
      where: { stage: "MOVED_IN", updatedAt: { gte: monthStart } },
    }),
    prisma.enquiry.groupBy({
      by: ["city"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    prisma.enquiry.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { assignedTo: { select: { name: true } } },
    }),
  ]);

  const pipelineValue = openDeals.reduce((s, d) => s + (d.monthlyValue || 0), 0);
  const pipelineCommission = openDeals.reduce(
    (s, d) => s + (d.commissionValue || 0),
    0,
  );

  const kpis = [
    {
      label: "New Enquiries Today",
      value: newToday,
      icon: ClipboardList,
      href: "/enquiries",
    },
    {
      label: "Active Pipeline",
      value: formatINR(pipelineValue, { short: true }),
      sub: `${openDeals.length} open deals`,
      icon: TrendingUp,
      href: "/pipeline",
    },
    {
      label: "Commission This Month",
      value: formatINR(monthWon._sum.commissionValue ?? 0, { short: true }),
      sub: "received on moved-in",
      icon: IndianRupee,
      href: "/reports",
    },
    {
      label: "Shortlists Sent (wk)",
      value: shortlistsWeek,
      icon: FileText,
      href: "/shortlists",
    },
    {
      label: "Visits This Week",
      value: `${visitsDoneWeek}/${visitsWeek}`,
      sub: "done / scheduled",
      icon: CalendarCheck,
      href: "/visits",
    },
    {
      label: "Deals Closed MTD",
      value: dealsClosedMTD,
      icon: Trophy,
      href: "/pipeline",
    },
  ];

  const cityCounts = new Map(byCity.map((r) => [r.city, r._count._all]));

  return (
    <div>
      <PageHeader
        title={isAdvisor ? `Good day, ${user.name?.split(" ")[0] ?? ""}` : "Dashboard"}
        description="Real-time snapshot of enquiries, pipeline, and advisory activity."
      />

      {myDay && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Your tasks today</CardTitle>
              <Link
                href="/tasks"
                className="text-xs font-medium text-primary hover:underline"
              >
                All tasks
              </Link>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {myDay[0].length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing due today. 🎉
                </p>
              )}
              {myDay[0].map((t) => {
                const overdue = new Date(t.dueDate) < new Date();
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {t.enquiry && (
                      <Link
                        href={`/enquiries/${t.enquiry.id}`}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        {t.enquiry.companyName}
                      </Link>
                    )}
                    <span
                      className={`shrink-0 text-xs ${
                        overdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {timeAgo(t.dueDate)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Your top open enquiries</CardTitle>
              <Link
                href="/enquiries"
                className="text-xs font-medium text-primary hover:underline"
              >
                All mine
              </Link>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {myDay[1].length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No open enquiries assigned to you.
                </p>
              )}
              {myDay[1].map((e) => (
                <Link
                  key={e.id}
                  href={`/enquiries/${e.id}`}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      e.priority === "hot"
                        ? "bg-red-500"
                        : e.priority === "cold"
                          ? "bg-sky-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {e.companyName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {e.city} · {titleCase(e.status)}
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                    {e.score ?? "–"}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <k.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {k.label}
                  </p>
                  <p className="text-2xl font-semibold">{k.value}</p>
                  {k.sub && (
                    <p className="text-xs text-muted-foreground">{k.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Enquiries</CardTitle>
            <Link
              href="/enquiries"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEnquiries.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No enquiries yet. Seed the database with{" "}
                <code>npm run db:seed</code>.
              </p>
            )}
            {recentEnquiries.map((e) => {
              const meta = ENQUIRY_STATUS_META[e.status];
              return (
                <Link
                  key={e.id}
                  href={`/enquiries/${e.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      e.priority === "hot"
                        ? "bg-red-500"
                        : e.priority === "cold"
                          ? "bg-sky-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.companyName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.seatsNeeded} seats · {e.city}
                      {e.microMarket ? ` · ${e.microMarket}` : ""}
                    </p>
                  </div>
                  <Badge className={meta?.color}>{meta?.label ?? e.status}</Badge>
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    {ageLabel(e.createdAt)}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enquiries by City</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CITIES.map((city) => {
              const count = cityCounts.get(city) ?? 0;
              const max = Math.max(1, ...Array.from(cityCounts.values()));
              return (
                <div key={city}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{city}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Pipeline commission (open):{" "}
        {formatINR(pipelineCommission, { short: true })} · Won commission MTD:{" "}
        {formatINR(monthWon._sum.commissionValue ?? 0)}
      </p>
    </div>
  );
}
