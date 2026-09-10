import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  IndianRupee,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";
import { SpaceVerifyButton } from "@/components/operators/space-verify-button";

export const dynamic = "force-dynamic";

export default async function SpaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();

  const space = await prisma.space.findUnique({
    where: { id: params.id },
    include: {
      operator: { include: { contacts: true } },
      _count: { select: { shortlistItems: true, visits: true, deals: true } },
      deals: {
        where: { stage: "MOVED_IN" },
        select: { id: true, seats: true },
      },
    },
  });
  if (!space) notFound();

  const stale =
    !space.lastVerifiedAt ||
    Date.now() - new Date(space.lastVerifiedAt).getTime() > 30 * 86400000;
  const bookedSeats = space.deals.reduce((s, d) => s + d.seats, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/operators"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Operators & Spaces
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{space.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/operators/${space.operatorId}`}
              className="text-primary hover:underline"
            >
              {space.operator.name}
            </Link>{" "}
            · {space.microMarket}, {space.city} · {titleCase(space.workspaceType)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{space.status}</Badge>
          <SpaceVerifyButton spaceId={space.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Space</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info icon={Building2} label="Capacity">
                {space.availableSeats} available / {space.totalSeats} total
              </Info>
              <Info icon={IndianRupee} label="Price / seat / month">
                {formatINR(space.pricePerSeat)}
              </Info>
              <Info icon={MapPin} label="Address">
                {space.address}
                {space.building ? ` · ${space.building}` : ""}
                {space.floor ? ` · Floor ${space.floor}` : ""}
              </Info>
              <Info icon={Building2} label="Area">
                {space.areaSqft ? `${space.areaSqft.toLocaleString()} sqft` : "—"}
              </Info>
              <Info icon={IndianRupee} label="Lock-in / Deposit">
                {space.lockInMonths ?? "—"} mo / {space.depositMonths ?? "—"} mo
              </Info>
              <Info icon={Building2} label="Move-in">
                {titleCase(space.moveInReady)}
              </Info>
              <div className="sm:col-span-2">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  {stale ? (
                    <AlertTriangle className="size-3.5 text-amber-600" />
                  ) : (
                    <ShieldCheck className="size-3.5 text-green-600" />
                  )}
                  Availability last verified
                </p>
                <p className={`text-sm ${stale ? "text-amber-700" : ""}`}>
                  {timeAgo(space.lastVerifiedAt)}
                  {stale ? " — needs re-check" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing & inclusions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {space.includedItems.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Included in price
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {space.includedItems.map((x) => (
                      <Badge key={x} className="bg-green-100 text-green-700">
                        {x}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {space.addOnItems.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Add-on costs
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {space.addOnItems.map((x) => (
                      <Badge key={x}>{x}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {space.amenities.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {space.amenities.map((x) => (
                      <Badge key={x}>{x}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {(space.brochureUrl || space.virtualTourUrl) && (
                <div className="flex gap-3 pt-1">
                  {space.brochureUrl && (
                    <a
                      href={space.brochureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Brochure
                    </a>
                  )}
                  {space.virtualTourUrl && (
                    <a
                      href={space.virtualTourUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Virtual tour
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Times shortlisted" value={space._count.shortlistItems} />
              <Row label="Visits" value={space._count.visits} />
              <Row label="Deals opened" value={space._count.deals} />
              <Row label="Seats booked (won)" value={bookedSeats} />
              {space._count.shortlistItems > 3 && space._count.deals === 0 && (
                <p className="pt-2 text-xs text-amber-600">
                  Shortlisted often but never booked — supply/demand gap.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operator contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {space.operator.contacts.map((c) => (
                <div key={c.id}>
                  <p className="font-medium">{c.name}</p>
                  <a
                    href={`tel:${c.phone}`}
                    className="text-primary hover:underline"
                  >
                    {c.phone}
                  </a>
                </div>
              ))}
              {space.operator.contacts.length === 0 && (
                <p className="text-muted-foreground">No contacts on file.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
