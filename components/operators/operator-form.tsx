"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";

export function OperatorForm({
  initial,
  onDone,
}: {
  initial?: any;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const editing = !!initial?.id;

  const [contacts, setContacts] = useState<any[]>(
    initial?.contacts?.length
      ? initial.contacts
      : [{ name: "", phone: "", designation: "", email: "", isPrimary: true }],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      type: fd.get("type"),
      website: fd.get("website") || undefined,
      commissionRate: fd.get("commissionRate") || undefined,
      rating: fd.get("rating") || undefined,
      notes: fd.get("notes") || undefined,
      contacts: contacts.filter((c) => c.name && c.phone),
    };
    try {
      await api.jsonFetch(
        editing ? `/api/operators/${initial.id}` : "/api/operators",
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      qc.invalidateQueries({ queryKey: ["operators"] });
      toast({ title: editing ? "Operator updated" : "Operator added", variant: "success" });
      onDone();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Operator name *</Label>
          <Input name="name" defaultValue={initial?.name} required />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select name="type" defaultValue={initial?.type ?? "independent"}>
            <option value="national_chain">National chain</option>
            <option value="regional">Regional</option>
            <option value="independent">Independent landlord</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Website</Label>
          <Input name="website" type="url" defaultValue={initial?.website ?? ""} placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label>Commission rate % (confidential)</Label>
          <Input name="commissionRate" type="number" step={0.5} min={0} max={100} defaultValue={initial?.commissionRate ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label>Internal rating (1–5)</Label>
          <Input name="rating" type="number" min={1} max={5} defaultValue={initial?.rating ?? ""} />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Contacts</Label>
        <div className="space-y-2">
          {contacts.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-4">
              <Input
                placeholder="Name"
                value={c.name}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, name: e.target.value };
                  setContacts(next);
                }}
              />
              <Input
                placeholder="Phone"
                value={c.phone}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, phone: e.target.value };
                  setContacts(next);
                }}
              />
              <Input
                placeholder="Designation"
                value={c.designation ?? ""}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, designation: e.target.value };
                  setContacts(next);
                }}
              />
              <Input
                placeholder="Email"
                value={c.email ?? ""}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, email: e.target.value };
                  setContacts(next);
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setContacts([...contacts, { name: "", phone: "", designation: "", email: "" }])
          }
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          + Add contact
        </button>
      </div>

      <div className="space-y-1.5">
        <Label>Notes / relationship history</Label>
        <Textarea name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Add operator"}
        </Button>
      </div>
    </form>
  );
}
