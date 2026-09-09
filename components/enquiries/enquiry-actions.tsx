"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, CalendarPlus, Handshake, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api, useMatchedSpaces } from "@/hooks/use-crm";

export function EnquiryActions({ enquiryId }: { enquiryId: string }) {
  const [dialog, setDialog] = useState<null | "visit" | "deal" | "call">(null);

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href={`/shortlists/new?enquiryId=${enquiryId}`}>
          <FileText className="size-4" /> Build Shortlist
        </Link>
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("visit")}>
        <CalendarPlus className="size-4" /> Schedule Visit
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("deal")}>
        <Handshake className="size-4" /> Open Deal
      </Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("call")}>
        <Phone className="size-4" /> Log Call
      </Button>

      <VisitDialog
        enquiryId={enquiryId}
        open={dialog === "visit"}
        onClose={() => setDialog(null)}
      />
      <DealDialog
        enquiryId={enquiryId}
        open={dialog === "deal"}
        onClose={() => setDialog(null)}
      />
      <CallDialog
        enquiryId={enquiryId}
        open={dialog === "call"}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function SpacePicker({
  enquiryId,
  name,
  required,
}: {
  enquiryId: string;
  name: string;
  required?: boolean;
}) {
  const { data } = useMatchedSpaces(enquiryId);
  return (
    <Select name={name} required={required} placeholder="Select space">
      {data?.map((m: any) => (
        <option key={m.id} value={m.id}>
          {m.name} — {m.operator.name} (₹{m.pricePerSeat}/seat, fit {m.matchScore})
        </option>
      ))}
    </Select>
  );
}

function VisitDialog({
  enquiryId,
  open,
  onClose,
}: {
  enquiryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

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
          scheduledAt: fd.get("scheduledAt"),
          type: fd.get("type"),
          operatorContact: fd.get("operatorContact") || undefined,
        }),
      });
      toast({ title: "Visit scheduled", description: "Reminders queued.", variant: "success" });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Schedule site visit">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Space *</Label>
          <SpacePicker enquiryId={enquiryId} name="spaceId" required />
        </div>
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
        <div className="space-y-1.5">
          <Label>Operator contact (joining)</Label>
          <Input name="operatorContact" placeholder="Name / phone" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DealDialog({
  enquiryId,
  open,
  onClose,
}: {
  enquiryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const deal = await api.jsonFetch<any>("/api/deals", {
        method: "POST",
        body: JSON.stringify({
          enquiryId,
          spaceId: fd.get("spaceId"),
          seats: fd.get("seats"),
          pricePerSeat: fd.get("pricePerSeat"),
          lockInMonths: fd.get("lockInMonths") || undefined,
          depositPaid: fd.get("depositPaid") || undefined,
        }),
      });
      toast({ title: "Deal opened", variant: "success" });
      onClose();
      router.push(`/pipeline?deal=${deal.id}`);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Open a deal">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Space *</Label>
          <SpacePicker enquiryId={enquiryId} name="spaceId" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Seats *</Label>
            <Input name="seats" type="number" min={1} required />
          </div>
          <div className="space-y-1.5">
            <Label>Agreed ₹/seat/mo *</Label>
            <Input name="pricePerSeat" type="number" min={0} step={500} required />
          </div>
          <div className="space-y-1.5">
            <Label>Lock-in (months)</Label>
            <Input name="lockInMonths" type="number" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label>Deposit paid (₹)</Label>
            <Input name="depositPaid" type="number" min={0} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Opening…" : "Open deal"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function CallDialog({
  enquiryId,
  open,
  onClose,
}: {
  enquiryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch("/api/calls", {
        method: "POST",
        body: JSON.stringify({
          enquiryId,
          direction: fd.get("direction"),
          outcome: fd.get("outcome"),
          durationSec: Number(fd.get("durationMin") || 0) * 60,
          notes: fd.get("notes") || undefined,
        }),
      });
      toast({ title: "Call logged", variant: "success" });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Log a call">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select name="direction" defaultValue="outbound">
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select name="outcome" defaultValue="connected">
              <option value="connected">Connected</option>
              <option value="no_answer">No answer</option>
              <option value="busy">Busy</option>
              <option value="voicemail">Voicemail</option>
              <option value="wrong_number">Wrong number</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration (min)</Label>
            <Input name="durationMin" type="number" min={0} defaultValue={0} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea name="notes" rows={2} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Log call"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
