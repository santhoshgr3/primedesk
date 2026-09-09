"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { api, useVisits, useMatchedSpaces } from "@/hooks/use-crm";
import { useEnquiries, useAdvisors } from "@/hooks/use-enquiries";
import { titleCase } from "@/lib/utils";

const STATUS_META: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  done: "bg-green-100 text-green-700",
  no_show: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
  rescheduled: "bg-amber-100 text-amber-700",
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function VisitsPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [advisorId, setAdvisorId] = useState("");
  const { data: advisors } = useAdvisors();
  const [outcomeVisit, setOutcomeVisit] = useState<any>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const base = startOfWeek(new Date());
  base.setDate(base.getDate() + weekOffset * 7);
  const weekEnd = new Date(base);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: visits, isLoading } = useVisits({
    from: base.toISOString(),
    to: weekEnd.toISOString(),
    advisorId,
  });

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [base],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const v of visits ?? []) {
      const key = new Date(v.scheduledAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return map;
  }, [visits]);

  return (
    <div>
      <PageHeader
        title="Site Visits"
        description="Weekly view of scheduled and completed visits."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setScheduleOpen(true)}>
              <CalendarPlus className="size-4" /> Schedule Visit
            </Button>
            <Select
              value={advisorId}
              onChange={(e) => setAdvisorId(e.target.value)}
              placeholder="All advisors"
              className="w-40"
            >
              {advisors?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
              {weekOffset === 0 ? "This week" : "Today"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <ScheduleVisitDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />

      <div className="grid gap-2 md:grid-cols-7">
        {days.map((d) => {
          const items = byDay.get(d.toDateString()) ?? [];
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <Card key={d.toISOString()} className={isToday ? "border-primary" : ""}>
              <div className="border-b p-2 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </p>
                <p className="text-sm font-semibold">{d.getDate()}</p>
              </div>
              <CardContent className="space-y-1.5 p-2">
                {items.length === 0 && (
                  <p className="py-2 text-center text-[11px] text-muted-foreground">—</p>
                )}
                {items.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setOutcomeVisit(v)}
                    className="w-full rounded-md border p-2 text-left text-xs hover:bg-accent"
                  >
                    <p className="font-medium">
                      {new Date(v.scheduledAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="truncate">{v.enquiry.companyName}</p>
                    <p className="truncate text-muted-foreground">{v.space.name}</p>
                    <Badge className={`mt-1 ${STATUS_META[v.status]}`}>
                      {titleCase(v.status)}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Loading visits…</p>
      )}

      <OutcomeDialog visit={outcomeVisit} onClose={() => setOutcomeVisit(null)} />
    </div>
  );
}

function OutcomeDialog({
  visit,
  onClose,
}: {
  visit: any;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!visit) return null;
  const done = visit.status === "done";

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await api.jsonFetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: `Marked ${status.replace(/_/g, " ")}`, variant: "success" });
      onClose();
      location.reload();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function submitOutcome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api.jsonFetch<any>(`/api/visits/${visit.id}/outcome`, {
        method: "POST",
        body: JSON.stringify({
          outcome: fd.get("outcome"),
          clientFeedback: fd.get("clientFeedback") || undefined,
          nextStep: fd.get("nextStep") || undefined,
          createDeal: fd.get("createDeal") === "on",
        }),
      });
      toast({
        title: "Outcome recorded",
        description: res.deal ? "Deal auto-created." : undefined,
        variant: "success",
      });
      onClose();
      location.reload();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!visit}
      onClose={onClose}
      title={`Visit — ${visit.enquiry.companyName}`}
      description={`${visit.space.name} · ${new Date(
        visit.scheduledAt,
      ).toLocaleString("en-IN")}`}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          href={`/enquiries/${visit.enquiry.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open enquiry →
        </Link>
      </div>

      {!done ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {["confirmed", "no_show", "cancelled", "rescheduled"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setStatus(s)}
              >
                {titleCase(s)}
              </Button>
            ))}
          </div>
          <form onSubmit={submitOutcome} className="space-y-3 border-t pt-3">
            <p className="text-sm font-medium">Record outcome (marks visit done)</p>
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select name="outcome" defaultValue="interested">
                <option value="interested">Interested</option>
                <option value="needs_another">Needs another option</option>
                <option value="revisit">Wants a revisit</option>
                <option value="not_interested">Not interested</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client feedback</Label>
              <Textarea name="clientFeedback" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Next step</Label>
              <Textarea name="nextStep" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="createDeal" defaultChecked />
              Open a deal if interested
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save outcome"}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="space-y-2 text-sm">
          <Badge className={STATUS_META.done}>Done</Badge>
          <p>
            <span className="text-muted-foreground">Outcome: </span>
            {titleCase(visit.outcome ?? "—")}
          </p>
          {visit.clientFeedback && (
            <p className="text-muted-foreground">{visit.clientFeedback}</p>
          )}
        </div>
      )}
    </Dialog>
  );
}

function ScheduleVisitDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: advisors } = useAdvisors();
  const [q, setQ] = useState("");
  const [enquiryId, setEnquiryId] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: enquiryData } = useEnquiries({ q, pageSize: "50" });
  const { data: spaces, isLoading: spacesLoading } = useMatchedSpaces(
    enquiryId,
    !!enquiryId,
  );

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch("/api/visits", {
        method: "POST",
        body: JSON.stringify({
          enquiryId,
          spaceId: fd.get("spaceId"),
          advisorId: fd.get("advisorId") || undefined,
          scheduledAt: fd.get("scheduledAt"),
          type: fd.get("type"),
          operatorContact: fd.get("operatorContact") || undefined,
        }),
      });
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast({
        title: "Visit scheduled",
        description: "Client confirmation + reminder tasks queued.",
        variant: "success",
      });
      setEnquiryId("");
      setQ("");
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Schedule a site visit"
      description="Pick the enquiry, then a matching space."
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Find enquiry</Label>
          <Input
            placeholder="Search company, contact, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Enquiry *</Label>
          <Select
            value={enquiryId}
            onChange={(e) => setEnquiryId(e.target.value)}
            required
            placeholder="Select enquiry"
          >
            {enquiryData?.rows.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.companyName} — {r.seatsNeeded} seats, {r.city}
              </option>
            ))}
          </Select>
        </div>

        {enquiryId && (
          <div className="space-y-1.5">
            <Label>Space *</Label>
            <Select name="spaceId" required placeholder="Select space">
              {spaces?.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.operator.name} (₹{m.pricePerSeat}/seat, fit{" "}
                  {m.matchScore})
                </option>
              ))}
            </Select>
            {spacesLoading && (
              <p className="text-xs text-muted-foreground">Matching spaces…</p>
            )}
            {!spacesLoading && spaces?.length === 0 && (
              <p className="text-xs text-amber-600">
                No matching spaces in this city — add inventory first.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date & time *</Label>
            <Input name="scheduledAt" type="datetime-local" required />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="type" defaultValue="physical">
              <option value="physical">Physical</option>
              <option value="virtual">Virtual tour</option>
              <option value="video_walkthrough">Video walkthrough</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Advisor</Label>
            <Select name="advisorId" placeholder="Enquiry's advisor">
              {advisors?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Operator contact</Label>
            <Input name="operatorContact" placeholder="Name / phone" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !enquiryId}>
            {busy ? "Scheduling…" : "Schedule visit"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
