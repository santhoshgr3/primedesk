"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { DealCard } from "@/components/pipeline/deal-card";
import { api, useDeals } from "@/hooks/use-crm";
import { DEAL_STAGES } from "@/lib/constants";
import { formatINR, titleCase } from "@/lib/utils";

function Column({
  stage,
  deals,
  onOpen,
}: {
  stage: string;
  deals: any[];
  onOpen: (d: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const value = deals.reduce((s, d) => s + d.monthlyValue, 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg bg-muted/50 ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="border-b p-3">
        <p className="text-sm font-semibold">{titleCase(stage)}</p>
        <p className="text-xs text-muted-foreground">
          {deals.length} · {formatINR(value, { short: true })}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={() => onOpen(d)} />
        ))}
        {deals.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

function Board() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const sp = useSearchParams();
  const { data: deals, isLoading } = useDeals();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openDeal, setOpenDeal] = useState<any>(null);
  const [lostPrompt, setLostPrompt] = useState<{ id: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byStage = useMemo(() => {
    const map = new Map<string, any[]>();
    DEAL_STAGES.forEach((s) => map.set(s, []));
    for (const d of deals ?? []) map.get(d.stage)?.push(d);
    return map;
  }, [deals]);

  const deepLinkDeal = sp.get("deal");
  useMemo(() => {
    if (deepLinkDeal && deals) {
      const d = deals.find((x) => x.id === deepLinkDeal);
      if (d) setOpenDeal(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkDeal, deals]);

  async function moveStage(id: string, stage: string, lostReason?: string) {
    try {
      await api.jsonFetch(`/api/deals/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage, lostReason }),
      });
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast({ title: `Moved to ${titleCase(stage)}`, variant: "success" });
    } catch (err: any) {
      toast({ title: "Move failed", description: err.message, variant: "error" });
    }
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    const deal = (deals ?? []).find((d) => d.id === id);
    if (!deal || deal.stage === target) return;
    if (target === "LOST") {
      setLostPrompt({ id });
      return;
    }
    moveStage(id, target);
  }

  const activeDeal = (deals ?? []).find((d) => d.id === activeId);
  const totalOpen = (deals ?? [])
    .filter((d) => !["MOVED_IN", "LOST"].includes(d.stage))
    .reduce((s, d) => s + d.monthlyValue, 0);

  return (
    <div>
      <PageHeader
        title="Deal Pipeline"
        description={`Open pipeline value: ${formatINR(totalOpen, { short: true })}/mo · drag cards between stages`}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {DEAL_STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                deals={byStage.get(stage) ?? []}
                onOpen={setOpenDeal}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} onOpen={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <DealDialog deal={openDeal} onClose={() => setOpenDeal(null)} />

      <Dialog
        open={!!lostPrompt}
        onClose={() => setLostPrompt(null)}
        title="Mark deal as lost"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (lostPrompt)
              moveStage(lostPrompt.id, "LOST", String(fd.get("reason")));
            setLostPrompt(null);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select name="reason" defaultValue="price">
              <option value="price">Price</option>
              <option value="location">Location</option>
              <option value="requirement_changed">Requirement changed</option>
              <option value="went_direct">Went direct</option>
              <option value="competitor">Competitor</option>
              <option value="no_response">No response</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setLostPrompt(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Mark lost
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function DealDialog({ deal, onClose }: { deal: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  if (!deal) return null;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          seats: fd.get("seats"),
          pricePerSeat: fd.get("pricePerSeat"),
          lockInMonths: fd.get("lockInMonths") || undefined,
          depositPaid: fd.get("depositPaid") || undefined,
          commissionRate: fd.get("commissionRate") || undefined,
          commissionStatus: fd.get("commissionStatus"),
          isCoBroker: fd.get("isCoBroker") === "on",
          coBrokerName: fd.get("coBrokerName") || undefined,
          coBrokerSplit: fd.get("coBrokerSplit") || undefined,
          notes: fd.get("notes") || undefined,
        }),
      });
      qc.invalidateQueries({ queryKey: ["deals"] });
      toast({ title: "Deal updated", variant: "success" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!deal}
      onClose={onClose}
      title={`${deal.enquiry.companyName} — ${deal.space.name}`}
      description={`${titleCase(deal.stage)} · ${formatINR(deal.monthlyValue)}/mo`}
      className="max-w-lg"
    >
      <div className="mb-3">
        <Link
          href={`/enquiries/${deal.enquiry.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open enquiry →
        </Link>
      </div>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Seats</Label>
            <Input name="seats" type="number" defaultValue={deal.seats} />
          </div>
          <div className="space-y-1.5">
            <Label>₹/seat/mo</Label>
            <Input name="pricePerSeat" type="number" defaultValue={deal.pricePerSeat} />
          </div>
          <div className="space-y-1.5">
            <Label>Lock-in (mo)</Label>
            <Input name="lockInMonths" type="number" defaultValue={deal.lockInMonths ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Deposit paid (₹)</Label>
            <Input name="depositPaid" type="number" defaultValue={deal.depositPaid ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Commission rate %</Label>
            <Input name="commissionRate" type="number" step={0.5} defaultValue={deal.commissionRate ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Commission status</Label>
            <Select name="commissionStatus" defaultValue={deal.commissionStatus}>
              <option value="pending">Pending</option>
              <option value="invoiced">Invoiced</option>
              <option value="received">Received</option>
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCoBroker" defaultChecked={deal.isCoBroker} />
          Co-broker deal
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Co-broker name</Label>
            <Input name="coBrokerName" defaultValue={deal.coBrokerName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Co-broker split %</Label>
            <Input name="coBrokerSplit" type="number" defaultValue={deal.coBrokerSplit ?? ""} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea name="notes" rows={2} defaultValue={deal.notes ?? ""} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save deal"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Board />
    </Suspense>
  );
}
