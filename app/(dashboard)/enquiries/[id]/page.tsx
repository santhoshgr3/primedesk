import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  IndianRupee,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChanger } from "@/components/enquiries/status-changer";
import { AssignAdvisor } from "@/components/enquiries/assign-advisor";
import { Timeline } from "@/components/enquiries/timeline";
import { EnquiryActions } from "@/components/enquiries/enquiry-actions";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";
import { ENQUIRY_STATUS_META, PRIORITY_META } from "@/lib/constants";

export default async function EnquiryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      shortlists: { orderBy: { createdAt: "desc" }, include: { items: true } },
      visits: {
        orderBy: { scheduledAt: "desc" },
        include: { space: { select: { name: true, city: true } } },
      },
      deals: { include: { space: { select: { name: true } } } },
      tasks: {
        where: { status: "pending" },
        orderBy: { dueDate: "asc" },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });

  if (!enquiry) notFound();

  const meta = ENQUIRY_STATUS_META[enquiry.status];
  const prio = PRIORITY_META[enquiry.priority];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/enquiries"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Enquiries
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${prio?.dot ?? "bg-gray-400"}`} />
            <h1 className="text-2xl font-semibold">{enquiry.companyName}</h1>
            <Badge className={meta?.color}>{meta?.label ?? enquiry.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {enquiry.industry ?? "Industry n/a"} ·{" "}
            {enquiry.companySize ? `${enquiry.companySize} people` : "size n/a"} ·
            created {timeAgo(enquiry.createdAt)} · via{" "}
            {titleCase(enquiry.source)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusChanger enquiryId={enquiry.id} current={enquiry.status} />
          <AssignAdvisor
            enquiryId={enquiry.id}
            currentId={enquiry.assignedToId}
          />
        </div>
      </div>

      <div className="mb-6">
        <EnquiryActions enquiryId={enquiry.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requirement</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info icon={Building2} label="Workspace type">
                {titleCase(enquiry.workspaceType)}
              </Info>
              <Info icon={MapPin} label="Location">
                {enquiry.city}
                {enquiry.microMarket ? ` · ${enquiry.microMarket}` : ""}
              </Info>
              <Info icon={Building2} label="Seats needed">
                {enquiry.seatsNeeded}
              </Info>
              <Info icon={IndianRupee} label="Budget / seat / month">
                {formatINR(enquiry.budgetPerSeat)}
              </Info>
              <Info icon={Clock} label="Move-in timeline">
                {enquiry.moveInTimeline
                  ? titleCase(enquiry.moveInTimeline)
                  : "—"}
              </Info>
              <Info icon={Clock} label="Last activity">
                {timeAgo(enquiry.lastActivityAt)}
              </Info>
              {enquiry.amenityPriority.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Amenity priorities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {enquiry.amenityPriority.map((a) => (
                      <Badge key={a}>{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {enquiry.notes && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm">{enquiry.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                enquiryId={enquiry.id}
                initial={enquiry.activities.map((a) => ({
                  ...a,
                  createdAt: a.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{enquiry.contactName}</p>
              {enquiry.contactDesig && (
                <p className="text-muted-foreground">{enquiry.contactDesig}</p>
              )}
              <a
                href={`tel:${enquiry.contactPhone}`}
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="size-4" /> {enquiry.contactPhone}
              </a>
              {enquiry.contactEmail && (
                <a
                  href={`mailto:${enquiry.contactEmail}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="size-4" /> {enquiry.contactEmail}
                </a>
              )}
              <a
                href={`https://wa.me/${enquiry.contactPhone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-md bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Open WhatsApp
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Open Tasks</CardTitle>
              <span className="text-xs text-muted-foreground">
                {enquiry.tasks.length}
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              {enquiry.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No open tasks — this enquiry needs a next action.
                </p>
              )}
              {enquiry.tasks.map((t) => (
                <div key={t.id} className="rounded-md border p-2 text-sm">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {titleCase(t.type)} · due {timeAgo(t.dueDate)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shortlists</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {enquiry.shortlists.length === 0 && (
                <p className="text-muted-foreground">None sent yet.</p>
              )}
              {enquiry.shortlists.map((s) => (
                <Link
                  key={s.id}
                  href={`/shortlists/${s.id}`}
                  className="flex items-center justify-between rounded-md border p-2 hover:bg-accent"
                >
                  <span>v{s.version} · {s.items.length} spaces</span>
                  <span className="text-xs text-muted-foreground">
                    {s.response ? titleCase(s.response) : s.sentAt ? "sent" : "draft"}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visits & Deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {enquiry.visits.map((v) => (
                <div key={v.id} className="rounded-md border p-2">
                  <p className="font-medium">{v.space.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(v.scheduledAt)} · {titleCase(v.status)}
                    {v.outcome ? ` · ${titleCase(v.outcome)}` : ""}
                  </p>
                </div>
              ))}
              {enquiry.deals.map((d) => (
                <Link
                  key={d.id}
                  href={`/pipeline?deal=${d.id}`}
                  className="block rounded-md border border-primary/30 bg-primary/5 p-2 hover:bg-primary/10"
                >
                  <p className="font-medium">{d.space.name} — deal</p>
                  <p className="text-xs text-muted-foreground">
                    {titleCase(d.stage)} · {formatINR(d.monthlyValue, { short: true })}/mo
                  </p>
                </Link>
              ))}
              {enquiry.visits.length === 0 && enquiry.deals.length === 0 && (
                <p className="text-muted-foreground">Nothing yet.</p>
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

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
