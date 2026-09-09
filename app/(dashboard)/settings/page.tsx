"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { api, useSettings, useTemplates } from "@/hooks/use-crm";
import { timeAgo } from "@/lib/utils";

const TABS = [
  { key: "branding", label: "Branding" },
  { key: "assignment", label: "Assignment" },
  { key: "sla", label: "SLA" },
  { key: "workingHours", label: "Working Hours" },
  { key: "templates", label: "Templates" },
  { key: "audit", label: "Audit Log" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("branding");
  const { data: settings, isLoading } = useSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Branding, assignment rules, SLAs, message templates and audit trail."
      />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={TABS} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          {tab === "branding" && <Section section="branding" title="Branding" fields={[
            { name: "companyName", label: "Company name" },
            { name: "primaryColor", label: "Primary colour (hex)" },
            { name: "logoUrl", label: "Logo URL" },
            { name: "phone", label: "Phone" },
            { name: "email", label: "Email" },
            { name: "website", label: "Website" },
          ]} value={settings.branding} />}

          {tab === "assignment" && <AssignmentSection value={settings.assignment} />}
          {tab === "sla" && <Section section="sla" title="SLA thresholds (hours)" type="number" fields={[
            { name: "firstCallHours", label: "First call within" },
            { name: "shortlistHours", label: "Shortlist within" },
            { name: "followUpHours", label: "Follow-up cadence" },
            { name: "overdueEscalationHours", label: "Escalate overdue after" },
          ]} value={settings.sla} />}
          {tab === "workingHours" && <WorkingHoursSection value={settings.workingHours} />}
          {tab === "templates" && <TemplatesSection />}
          {tab === "audit" && <AuditSection />}
        </>
      )}
    </div>
  );
}

function useSave() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return async (section: string, value: unknown) => {
    try {
      await api.jsonFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ section, value }),
      });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Saved", variant: "success" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "error" });
    }
  };
}

function Section({
  section,
  title,
  fields,
  value,
  type = "text",
}: {
  section: string;
  title: string;
  fields: { name: string; label: string }[];
  value: Record<string, any>;
  type?: string;
}) {
  const save = useSave();
  const [form, setForm] = useState(value);
  useEffect(() => setForm(value), [value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label>{f.label}</Label>
            <Input
              type={type}
              value={form[f.name] ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  [f.name]:
                    type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={() => save(section, form)}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentSection({ value }: { value: any }) {
  const save = useSave();
  const [mode, setMode] = useState(value.mode);
  const [auto, setAuto] = useState(value.autoAssignInbound);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Enquiry assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="round_robin">Round-robin</option>
            <option value="city_based">City-based routing</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          Auto-assign inbound enquiries (website / Meta / WhatsApp)
        </label>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save("assignment", { mode, autoAssignInbound: auto })
            }
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkingHoursSection({ value }: { value: any }) {
  const save = useSave();
  const [start, setStart] = useState(value.start);
  const [end, setEnd] = useState(value.end);
  const [days, setDays] = useState<number[]>(value.days);
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Working hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Working days</Label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((d, i) => {
              const num = i + 1;
              const on = days.includes(num);
              return (
                <button
                  key={d}
                  onClick={() =>
                    setDays((p) =>
                      on ? p.filter((x) => x !== num) : [...p, num],
                    )
                  }
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() =>
              save("workingHours", { start, end, days: days.sort() })
            }
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatesSection() {
  const { data: templates } = useTemplates();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.jsonFetch("/api/messages/templates", {
        method: "POST",
        body: JSON.stringify({
          key: fd.get("key"),
          name: fd.get("name"),
          channel: fd.get("channel"),
          body: fd.get("body"),
          approved: fd.get("approved") === "on",
        }),
      });
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template saved", variant: "success" });
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="divide-y p-0">
          {templates?.map((t: any) => (
            <button
              key={t.key}
              onClick={() => setEditing(t)}
              className="block w-full p-3 text-left hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.name}</span>
                {t.approved ? (
                  <Badge className="bg-green-100 text-green-700">approved</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">draft</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => setEditing({ key: "", name: "", channel: "whatsapp", body: "", approved: false })}>
        + New template
      </Button>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editing.key ? `Edit — ${editing.name}` : "New template"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Key (a–z, _)</Label>
                  <Input name="key" defaultValue={editing.key} required readOnly={!!editing.key} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editing.name} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select name="channel" defaultValue={editing.channel}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Body — use {"{{name}}"}, {"{{company}}"}, {"{{advisor}}"}</Label>
                <Textarea name="body" rows={4} defaultValue={editing.body} required />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="approved" defaultChecked={editing.approved} />
                Approved for sending
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save template</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuditSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api.jsonFetch<any[]>("/api/audit"),
  });

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {data?.map((l) => (
          <div key={l.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{l.action}</p>
              <p className="text-xs text-muted-foreground">
                {l.entity ?? "—"} · {l.user?.name ?? "system"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {timeAgo(l.createdAt)}
            </span>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No audit entries yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
