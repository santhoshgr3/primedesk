import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";
import { OperatorSpacesActions } from "@/components/operators/operator-detail-actions";

export const dynamic = "force-dynamic";

export default async function OperatorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const operator = await prisma.operator.findUnique({
    where: { id: params.id },
    include: {
      contacts: true,
      spaces: { orderBy: { createdAt: "desc" } },
      deals: {
        include: {
          enquiry: { select: { companyName: true } },
          space: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!operator) notFound();

  const wonCommission = operator.deals
    .filter((d) => d.stage === "MOVED_IN")
    .reduce((s, d) => s + (d.commissionValue ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/operators"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Operators
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {operator.name}
            <span className="flex text-amber-500">
              {Array.from({ length: operator.rating ?? 0 }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {titleCase(operator.type)} ·{" "}
            {operator.commissionRate != null
              ? `${operator.commissionRate}% commission`
              : "commission not set"}{" "}
            · {operator.spaces.length} spaces
          </p>
        </div>
        <OperatorSpacesActions operator={JSON.parse(JSON.stringify(operator))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Spaces</CardTitle>
              <span className="text-xs text-muted-foreground">
                {operator.spaces.filter((s) => s.isActive).length} active
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Avail/Total</TableHead>
                    <TableHead className="text-right">₹/seat</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operator.spaces.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs">
                        {s.microMarket}, {s.city}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.availableSeats}/{s.totalSeats}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatINR(s.pricePerSeat)}
                      </TableCell>
                      <TableCell>
                        <Badge>{s.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {operator.spaces.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                        No spaces listed yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {operator.deals.length === 0 && (
                <p className="text-sm text-muted-foreground">No deals yet.</p>
              )}
              {operator.deals.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.enquiry.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.space.name} · {d.seats} seats
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>{titleCase(d.stage)}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatINR(d.commissionValue ?? 0, { short: true })} comm.
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {operator.contacts.map((c) => (
                <div key={c.id}>
                  <p className="font-medium">
                    {c.name}
                    {c.isPrimary && (
                      <Badge className="ml-2 bg-primary/10 text-primary">
                        primary
                      </Badge>
                    )}
                  </p>
                  {c.designation && (
                    <p className="text-xs text-muted-foreground">
                      {c.designation}
                    </p>
                  )}
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Phone className="size-3.5" /> {c.phone}
                  </a>
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Mail className="size-3.5" /> {c.email}
                    </a>
                  )}
                </div>
              ))}
              {operator.contacts.length === 0 && (
                <p className="text-muted-foreground">No contacts.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label="Won commission" value={formatINR(wonCommission, { short: true })} />
              <Row
                label="Deals won"
                value={operator.deals.filter((d) => d.stage === "MOVED_IN").length}
              />
              <Row label="Added" value={timeAgo(operator.createdAt)} />
            </CardContent>
          </Card>

          {operator.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{operator.notes}</CardContent>
            </Card>
          )}
        </div>
      </div>
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
