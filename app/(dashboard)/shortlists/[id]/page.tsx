import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";
import { ShortlistResponseForm } from "@/components/shortlists/response-form";
import { ShareLinkButton } from "@/components/shortlists/share-link";

export const dynamic = "force-dynamic";

export default async function ShortlistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: params.id },
    include: {
      enquiry: { select: { id: true, companyName: true, contactName: true } },
      advisor: { select: { name: true } },
      items: {
        orderBy: { rank: "asc" },
        include: { space: { include: { operator: { select: { name: true } } } } },
      },
    },
  });
  if (!shortlist) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/shortlists"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Shortlists
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Shortlist v{shortlist.version} —{" "}
            <Link
              href={`/enquiries/${shortlist.enquiry.id}`}
              className="text-primary hover:underline"
            >
              {shortlist.enquiry.companyName}
            </Link>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Built by {shortlist.advisor.name} ·{" "}
            {shortlist.sentAt
              ? `sent ${timeAgo(shortlist.sentAt)} via ${shortlist.sentVia.join(" + ")}`
              : "not sent yet"}
            {shortlist.viewedAt
              ? ` · client opened ${timeAgo(shortlist.viewedAt)}`
              : shortlist.shareToken
                ? " · link not opened yet"
                : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ShareLinkButton
            shortlistId={shortlist.id}
            existingToken={shortlist.shareToken}
          />
          <a
            href={`/api/shortlists/${shortlist.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <ExternalLink className="size-4" /> Open PDF
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {shortlist.items.map((it) => (
            <Card
              key={it.id}
              className={it.clientPreferred ? "border-green-400" : ""}
            >
              <CardContent className="flex gap-4 p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {it.rank}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {it.space.name}
                      {it.clientPreferred && (
                        <Badge className="ml-2 bg-green-100 text-green-700">
                          client picked
                        </Badge>
                      )}
                    </p>
                    <p className="font-semibold text-primary">
                      {formatINR(it.space.pricePerSeat)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /seat/mo
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {it.space.operator.name} · {it.space.microMarket},{" "}
                    {it.space.city} · {titleCase(it.space.workspaceType)} ·{" "}
                    {it.space.availableSeats} seats
                  </p>
                  {it.advisorNote && (
                    <p className="mt-2 rounded border-l-2 border-amber-400 bg-amber-50 px-2 py-1 text-xs">
                      {it.advisorNote}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Response</CardTitle>
            </CardHeader>
            <CardContent>
              {shortlist.response ? (
                <div className="space-y-2 text-sm">
                  <Badge className="bg-green-100 text-green-700">
                    {titleCase(shortlist.response)}
                  </Badge>
                  {shortlist.clientNote && (
                    <p className="text-muted-foreground">{shortlist.clientNote}</p>
                  )}
                </div>
              ) : (
                <ShortlistResponseForm
                  shortlistId={shortlist.id}
                  spaces={shortlist.items.map((i) => ({
                    id: i.spaceId,
                    name: i.space.name,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
