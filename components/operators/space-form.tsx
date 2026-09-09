"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api, useOperators } from "@/hooks/use-crm";
import {
  CITIES,
  MICRO_MARKETS,
  WORKSPACE_TYPES,
  AMENITIES,
} from "@/lib/constants";

export function SpaceForm({
  initial,
  operatorId,
  onDone,
}: {
  initial?: any;
  operatorId?: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: operators } = useOperators();
  const editing = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState(initial?.city ?? "");
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      operatorId: operatorId ?? fd.get("operatorId"),
      name: fd.get("name"),
      city: fd.get("city"),
      microMarket: fd.get("microMarket"),
      address: fd.get("address"),
      workspaceType: fd.get("workspaceType"),
      totalSeats: fd.get("totalSeats"),
      availableSeats: fd.get("availableSeats"),
      areaSqft: fd.get("areaSqft") || undefined,
      floor: fd.get("floor") || undefined,
      building: fd.get("building") || undefined,
      pricePerSeat: fd.get("pricePerSeat"),
      lockInMonths: fd.get("lockInMonths") || undefined,
      depositMonths: fd.get("depositMonths") || undefined,
      moveInReady: fd.get("moveInReady"),
      status: fd.get("status"),
      amenities,
    };
    try {
      await api.jsonFetch(editing ? `/api/spaces/${initial.id}` : "/api/spaces", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      qc.invalidateQueries({ queryKey: ["spaces"] });
      qc.invalidateQueries({ queryKey: ["operators"] });
      toast({ title: editing ? "Space updated" : "Space added", variant: "success" });
      onDone();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {!operatorId && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Operator *</Label>
            <Select name="operatorId" defaultValue={initial?.operatorId} required placeholder="Select operator">
              {operators?.map((o: any) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Space name / code *</Label>
          <Input name="name" defaultValue={initial?.name} required />
        </div>
        <div className="space-y-1.5">
          <Label>Workspace type</Label>
          <Select name="workspaceType" defaultValue={initial?.workspaceType ?? "MANAGED_OFFICE"}>
            {WORKSPACE_TYPES.filter((t) => t.value !== "NOT_SURE").map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>City *</Label>
          <Select name="city" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Select city">
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Micro-market *</Label>
          <Select name="microMarket" required defaultValue={initial?.microMarket} placeholder="Select area">
            {(MICRO_MARKETS[city] ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address *</Label>
          <Input name="address" defaultValue={initial?.address} required />
        </div>
        <div className="space-y-1.5">
          <Label>Building</Label>
          <Input name="building" defaultValue={initial?.building ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Floor</Label>
          <Input name="floor" defaultValue={initial?.floor ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Total seats *</Label>
          <Input name="totalSeats" type="number" min={1} defaultValue={initial?.totalSeats} required />
        </div>
        <div className="space-y-1.5">
          <Label>Available seats *</Label>
          <Input name="availableSeats" type="number" min={0} defaultValue={initial?.availableSeats} required />
        </div>
        <div className="space-y-1.5">
          <Label>Area (sqft)</Label>
          <Input name="areaSqft" type="number" min={0} defaultValue={initial?.areaSqft ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Price / seat / month (₹) *</Label>
          <Input name="pricePerSeat" type="number" min={0} step={500} defaultValue={initial?.pricePerSeat} required />
        </div>
        <div className="space-y-1.5">
          <Label>Lock-in (months)</Label>
          <Input name="lockInMonths" type="number" min={0} defaultValue={initial?.lockInMonths ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Deposit (months)</Label>
          <Input name="depositMonths" type="number" min={0} defaultValue={initial?.depositMonths ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Move-in readiness</Label>
          <Select name="moveInReady" defaultValue={initial?.moveInReady ?? "ready"}>
            <option value="ready">Ready</option>
            <option value="2_weeks">2 weeks</option>
            <option value="1_month">1 month</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select name="status" defaultValue={initial?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="full">Full</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Amenities</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() =>
                setAmenities((prev) =>
                  prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
                )
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                amenities.includes(a)
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add space"}
        </Button>
      </div>
    </form>
  );
}
