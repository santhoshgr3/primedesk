import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CompareSpacesPage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  await requireUser();
  const ids = (searchParams.ids ?? "").split(",").filter(Boolean).slice(0, 3);

  const spaces = ids.length
    ? await prisma.space.findMany({
        where: { id: { in: ids } },
        include: {
          operator: { select: { name: true } },
          _count: { select: { shortlistItems: true, visits: true, deals: true } },
        },
      })
    : [];
  // preserve requested order
  const ordered = ids
    .map((id) => spaces.find((s) => s.id === id))
    .filter(Boolean) as typeof spaces;

  const rows: { label: string; get: (s: (typeof spaces)[number]) => React.ReactNode }[] =
    [
      { label: "Operator", get: (s) => s.operator.name },
      { label: "Location", get: (s) => `${s.microMarket}, ${s.city}` },
      { label: "Type", get: (s) => titleCase(s.workspaceType) },
      {
        label: "Available / Total seats",
        get: (s) => `${s.availableSeats} / ${s.totalSeats}`,
      },
      { label: "₹ / seat / month", get: (s) => formatINR(s.pricePerSeat) },
      { label: "Lock-in", get: (s) => `${s.lockInMonths ?? "—"} mo` },
      { label: "Deposit", get: (s) => `${s.depositMonths ?? "—"} mo` },
      { label: "Area (sqft)", get: (s) => s.areaSqft?.toLocaleString() ?? "—" },
      { label: "Move-in", get: (s) => titleCase(s.moveInReady) },
      {
        label: "Included",
        get: (s) => s.includedItems.join(", ") || "—",
      },
      {
        label: "Amenities",
        get: (s) => s.amenities.join(", ") || "—",
      },
      {
        label: "Last verified",
        get: (s) => timeAgo(s.lastVerifiedAt),
      },
      {
        label: "Times shortlisted",
        get: (s) => s._count.shortlistItems,
      },
      { label: "Deals", get: (s) => s._count.deals },
    ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/operators"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Operators & Spaces
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">Compare spaces</h1>

      {ordered.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Pick 2–3 spaces on the Spaces tab and click “Compare”.
        </p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-xs uppercase text-muted-foreground">
                  Attribute
                </th>
                {ordered.map((s) => (
                  <th key={s.id} className="p-3 text-left">
                    <Link
                      href={`/spaces/${s.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b last:border-0">
                  <td className="p-3 text-xs font-medium uppercase text-muted-foreground">
                    {r.label}
                  </td>
                  {ordered.map((s) => (
                    <td key={s.id} className="p-3 align-top">
                      {r.get(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
