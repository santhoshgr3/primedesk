"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { api } from "@/hooks/use-crm";
import { timeAgo, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAdvisors } from "@/hooks/use-enquiries";
import {
  CITIES,
  MICRO_MARKETS,
  INDUSTRIES,
  SEAT_RANGES,
  WORKSPACE_TYPES,
  ENQUIRY_SOURCES,
  MOVE_IN_TIMELINES,
  AMENITIES,
} from "@/lib/constants";

export default function NewEnquiryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: advisors } = useAdvisors();
  const [saving, setSaving] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [dupes, setDupes] = useState<any[]>([]);

  async function checkDuplicate(company: string, phone: string) {
    if (company.trim().length < 3 && phone.replace(/\D/g, "").length < 7) {
      setDupes([]);
      return;
    }
    try {
      const res = await api.jsonFetch<{ matches: any[] }>(
        `/api/enquiries/check-duplicate?company=${encodeURIComponent(
          company,
        )}&phone=${encodeURIComponent(phone)}`,
      );
      setDupes(res.matches);
    } catch {
      /* non-blocking */
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      companyName: fd.get("companyName"),
      industry: fd.get("industry") || undefined,
      companySize: fd.get("companySize") || undefined,
      contactName: fd.get("contactName"),
      contactDesig: fd.get("contactDesig") || undefined,
      contactPhone: fd.get("contactPhone"),
      contactEmail: fd.get("contactEmail") || undefined,
      seatsNeeded: fd.get("seatsNeeded"),
      city: fd.get("city"),
      microMarket: fd.get("microMarket") || undefined,
      workspaceType: fd.get("workspaceType"),
      budgetPerSeat: fd.get("budgetPerSeat") || undefined,
      moveInTimeline: fd.get("moveInTimeline") || undefined,
      source: fd.get("source"),
      assignedToId: fd.get("assignedToId") || undefined,
      priority: fd.get("priority") || "warm",
      amenityPriority: amenities,
      notes: fd.get("notes") || undefined,
    };

    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        title: "Could not create enquiry",
        description: err.error ?? "Check the form and try again.",
        variant: "error",
      });
      return;
    }
    const created = await res.json();
    qc.invalidateQueries({ queryKey: ["enquiries"] });
    toast({ title: "Enquiry created", variant: "success" });
    router.push(`/enquiries/${created.id}`);
  }

  const toggleAmenity = (a: string) =>
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Enquiry"
        description="Capture the requirement. Only company, contact, seats & city are required — fill the rest after the requirement call."
      />

      {dupes.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="size-4" />
            {dupes.length} possible duplicate{dupes.length > 1 ? "s" : ""} —
            check before creating a new enquiry
          </p>
          <ul className="mt-2 space-y-1">
            {dupes.map((d) => (
              <li key={d.id} className="text-sm">
                <Link
                  href={`/enquiries/${d.id}`}
                  target="_blank"
                  className="font-medium text-amber-900 underline"
                >
                  {d.companyName}
                </Link>{" "}
                <span className="text-amber-700">
                  · {d.contactName} · {d.contactPhone} · {titleCase(d.status)}
                  {d.assignedTo ? ` · ${d.assignedTo.name}` : ""} ·{" "}
                  {timeAgo(d.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" required>
              <Input
                name="companyName"
                required
                onBlur={(e) =>
                  checkDuplicate(
                    e.target.value,
                    (
                      e.currentTarget.form?.elements.namedItem(
                        "contactPhone",
                      ) as HTMLInputElement
                    )?.value ?? "",
                  )
                }
              />
            </Field>
            <Field label="Industry">
              <Select name="industry" placeholder="Select industry">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Company size (headcount)">
              <Input name="companySize" type="number" min={1} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decision Maker</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input name="contactName" required />
            </Field>
            <Field label="Designation">
              <Input name="contactDesig" placeholder="HR Head, Admin, CEO…" />
            </Field>
            <Field label="Phone (WhatsApp)" required>
              <Input
                name="contactPhone"
                required
                placeholder="+91…"
                onBlur={(e) =>
                  checkDuplicate(
                    (
                      e.currentTarget.form?.elements.namedItem(
                        "companyName",
                      ) as HTMLInputElement
                    )?.value ?? "",
                    e.target.value,
                  )
                }
              />
            </Field>
            <Field label="Email">
              <Input name="contactEmail" type="email" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requirement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Seats needed" required>
              <Select name="seatsNeeded" placeholder="Select range" required>
                {SEAT_RANGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City" required>
              <Select
                name="city"
                placeholder="Select city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Micro-market">
              <Select name="microMarket" placeholder="Select area">
                {(MICRO_MARKETS[city] ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Workspace type">
              <Select name="workspaceType" defaultValue="NOT_SURE">
                {WORKSPACE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Budget per seat / month (₹)">
              <Input name="budgetPerSeat" type="number" min={0} step={500} />
            </Field>
            <Field label="Move-in timeline">
              <Select name="moveInTimeline" placeholder="Select timeline">
                {MOVE_IN_TIMELINES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Label className="mb-2 block">Amenity priorities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
            <div className="sm:col-span-2">
              <Field label="Notes / special requirements">
                <Textarea name="notes" rows={3} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment & Meta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Lead source">
              <Select name="source" defaultValue="WEBSITE_FORM">
                {ENQUIRY_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assign advisor">
              <Select name="assignedToId" placeholder="Unassigned">
                {advisors?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" defaultValue="warm">
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create Enquiry"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
