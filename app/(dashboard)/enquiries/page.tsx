"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Download, Star, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ageLabel, timeAgo, titleCase } from "@/lib/utils";
import {
  CITIES,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_META,
  WORKSPACE_TYPES,
} from "@/lib/constants";
import { useEnquiries, useAdvisors } from "@/hooks/use-enquiries";
import { api } from "@/hooks/use-crm";
import { ImportDialog } from "@/components/enquiries/import-dialog";

const PRIORITY_DOT: Record<string, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-sky-500",
};

type Filters = {
  q: string;
  city: string;
  status: string;
  workspaceType: string;
  assignedToId: string;
  priority: string;
};

const EMPTY: Filters = {
  q: "",
  city: "",
  status: "",
  workspaceType: "",
  assignedToId: "",
  priority: "",
};

const VIEWS_KEY = "primedesk.enquiryViews";

export default function EnquiriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: advisors } = useAdvisors();

  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [customViews, setCustomViews] = useState<
    { name: string; filters: Filters }[]
  >([]);
  const [namingView, setNamingView] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEWS_KEY);
      if (raw) setCustomViews(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const [page, setPage] = useState(1);

  const presets: { name: string; filters: Partial<Filters> }[] = [
    { name: "All", filters: {} },
    { name: "New", filters: { status: "NEW" } },
    { name: "Unassigned", filters: { assignedToId: "unassigned" } },
    ...(session?.user?.id
      ? [{ name: "My enquiries", filters: { assignedToId: session.user.id } }]
      : []),
    { name: "Hot leads", filters: { priority: "hot" } },
    { name: "Awaiting response", filters: { status: "SHORTLIST_SENT" } },
    { name: "In negotiation", filters: { status: "NEGOTIATION" } },
  ];

  const applyView = (f: Partial<Filters>) => {
    setSelected(new Set());
    setPage(1);
    setFilters({ ...EMPTY, ...f });
  };

  const activePreset = (f: Partial<Filters>) =>
    JSON.stringify({ ...EMPTY, ...f }) === JSON.stringify(filters);

  const saveView = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [
      ...customViews.filter((v) => v.name !== trimmed),
      { name: trimmed, filters },
    ];
    setCustomViews(next);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
    setNamingView(false);
    toast({ title: `Saved view “${trimmed}”`, variant: "success" });
  };

  const deleteView = (name: string) => {
    const next = customViews.filter((v) => v.name !== name);
    setCustomViews(next);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
  };

  const params = useMemo(
    () => ({ ...filters, page: String(page), pageSize: "25" }),
    [filters, page],
  );
  const { data, isLoading, isError } = useEnquiries(params);

  const set = (k: keyof typeof filters) => (v: string) => {
    setSelected(new Set());
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };

  const rows = data?.rows ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function bulk(payload: Record<string, unknown>) {
    setBulkBusy(true);
    try {
      const res = await api.jsonFetch<any>("/api/enquiries/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected], ...payload }),
      });
      toast({ title: `${res.updated} enquiries updated`, variant: "success" });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["enquiries"] });
    } catch (err: any) {
      toast({ title: "Bulk action failed", description: err.message, variant: "error" });
    } finally {
      setBulkBusy(false);
    }
  }

  const exportUrl = `/api/enquiries/export?${new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  ).toString()}`;

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Every company looking for office space, from first touch to closed lease."
        action={
          <div className="flex flex-wrap gap-2">
            <ImportDialog />
            <Button asChild variant="outline">
              <a href={exportUrl}>
                <Download className="size-4" /> Export CSV
              </a>
            </Button>
            <Button asChild>
              <Link href="/enquiries/new">
                <Plus className="size-4" /> New Enquiry
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => applyView(p.filters)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activePreset(p.filters)
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.name}
          </button>
        ))}
        {customViews.map((v) => (
          <span
            key={v.name}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
              activePreset(v.filters)
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground"
            }`}
          >
            <button onClick={() => applyView(v.filters)}>{v.name}</button>
            <button onClick={() => deleteView(v.name)} title="Delete view">
              <X className="size-3" />
            </button>
          </span>
        ))}
        {namingView ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveView(
                (e.currentTarget.elements.namedItem("v") as HTMLInputElement)
                  .value,
              );
            }}
            className="inline-flex items-center gap-1"
          >
            <input
              name="v"
              autoFocus
              placeholder="View name…"
              onBlur={() => setNamingView(false)}
              className="h-7 w-32 rounded-full border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        ) : (
          <button
            onClick={() => setNamingView(true)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Star className="size-3" /> Save view
          </button>
        )}
      </div>

      <Card className="mb-4 p-3">
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Input
            placeholder="Search company, contact, phone…"
            value={filters.q}
            onChange={(e) => set("q")(e.target.value)}
            className="lg:col-span-2"
          />
          <Select placeholder="All cities" value={filters.city} onChange={(e) => set("city")(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select placeholder="All types" value={filters.workspaceType} onChange={(e) => set("workspaceType")(e.target.value)}>
            {WORKSPACE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Select placeholder="All statuses" value={filters.status} onChange={(e) => set("status")(e.target.value)}>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>{ENQUIRY_STATUS_META[s]?.label ?? s}</option>
            ))}
          </Select>
          <Select placeholder="Any advisor" value={filters.assignedToId} onChange={(e) => set("assignedToId")(e.target.value)}>
            <option value="unassigned">Unassigned</option>
            {advisors?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Select
            className="w-44"
            placeholder="Assign advisor…"
            disabled={bulkBusy}
            onChange={(e) =>
              e.target.value && bulk({ action: "assign", assignedToId: e.target.value })
            }
          >
            {advisors?.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
          <Select
            className="w-36"
            placeholder="Set priority…"
            disabled={bulkBusy}
            onChange={(e) => e.target.value && bulk({ action: "priority", priority: e.target.value })}
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulk({ action: "archive" })}>
            Archive
          </Button>
          <button
            className="ml-auto text-xs text-muted-foreground hover:underline"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead className="text-right">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Loading enquiries…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-destructive">
                  Failed to load. Is the database seeded and running?
                </TableCell>
              </TableRow>
            )}
            {rows.length === 0 && !isLoading && !isError && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No enquiries match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((e) => {
              const meta = ENQUIRY_STATUS_META[e.status];
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleOne(e.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/enquiries/${e.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <span className={`size-2 rounded-full ${PRIORITY_DOT[e.priority] ?? "bg-gray-400"}`} />
                      {e.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.contactName}</TableCell>
                  <TableCell>{e.seatsNeeded}</TableCell>
                  <TableCell>{e.city}</TableCell>
                  <TableCell className="text-xs">{titleCase(e.workspaceType)}</TableCell>
                  <TableCell>
                    <Badge className={meta?.color}>{meta?.label ?? e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.assignedTo?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground" title={timeAgo(e.createdAt)}>
                    {ageLabel(e.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {data && (
        <Pagination
          page={page}
          pageSize={25}
          total={data.total}
          onPage={setPage}
        />
      )}
    </div>
  );
}
