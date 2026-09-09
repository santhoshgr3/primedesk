"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Star, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OperatorForm } from "@/components/operators/operator-form";
import { SpaceForm } from "@/components/operators/space-form";
import { useOperators, useSpaces } from "@/hooks/use-crm";
import { formatINR, timeAgo, titleCase } from "@/lib/utils";
import { CITIES, WORKSPACE_TYPES } from "@/lib/constants";

export default function OperatorsPage() {
  const [tab, setTab] = useState("operators");
  const [dialog, setDialog] = useState<null | "operator" | "space">(null);

  return (
    <div>
      <PageHeader
        title="Operators & Spaces"
        description="PrimeDesk's supply side — partner operators and their live inventory."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDialog("operator")}>
              <Plus className="size-4" /> Operator
            </Button>
            <Button onClick={() => setDialog("space")}>
              <Plus className="size-4" /> Space
            </Button>
          </div>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "operators", label: "Operators" },
          { key: "spaces", label: "Spaces" },
          { key: "availability", label: "Availability" },
        ]}
      />

      {tab === "operators" && <OperatorsTab />}
      {tab === "spaces" && <SpacesTab />}
      {tab === "availability" && <AvailabilityTab />}

      <Dialog
        open={dialog === "operator"}
        onClose={() => setDialog(null)}
        title="Add operator"
      >
        <OperatorForm onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog
        open={dialog === "space"}
        onClose={() => setDialog(null)}
        title="Add space"
        className="max-w-2xl"
      >
        <SpaceForm onDone={() => setDialog(null)} />
      </Dialog>
    </div>
  );
}

function OperatorsTab() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useOperators(q);

  return (
    <Card>
      <div className="p-3">
        <Input
          placeholder="Search operators…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operator</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Spaces</TableHead>
            <TableHead className="text-right">Deals</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead>Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {data?.map((o: any) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link href={`/operators/${o.id}`} className="font-medium hover:underline">
                  {o.name}
                </Link>
                {!o.isActive && <Badge className="ml-2 bg-gray-100 text-gray-500">inactive</Badge>}
              </TableCell>
              <TableCell className="text-xs">{titleCase(o.type)}</TableCell>
              <TableCell className="text-right">{o._count.spaces}</TableCell>
              <TableCell className="text-right">{o._count.deals}</TableCell>
              <TableCell className="text-right">
                {o.commissionRate != null ? `${o.commissionRate}%` : "—"}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: o.rating ?? 0 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-current" />
                  ))}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function SpacesTab() {
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    workspaceType: "",
    minSeats: "",
    maxPrice: "",
  });
  const params = useMemo(() => ({ ...filters, pageSize: "100" }), [filters]);
  const { data, isLoading } = useSpaces(params);
  const [edit, setEdit] = useState<any>(null);
  const set = (k: keyof typeof filters) => (v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  return (
    <Card>
      <div className="grid gap-2 p-3 md:grid-cols-3 lg:grid-cols-5">
        <Input placeholder="Search…" value={filters.q} onChange={(e) => set("q")(e.target.value)} />
        <Select placeholder="All cities" value={filters.city} onChange={(e) => set("city")(e.target.value)}>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select placeholder="All types" value={filters.workspaceType} onChange={(e) => set("workspaceType")(e.target.value)}>
          {WORKSPACE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <Input placeholder="Min seats" type="number" value={filters.minSeats} onChange={(e) => set("minSeats")(e.target.value)} />
        <Input placeholder="Max ₹/seat" type="number" value={filters.maxPrice} onChange={(e) => set("maxPrice")(e.target.value)} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Space</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Avail / Total</TableHead>
            <TableHead className="text-right">₹/seat</TableHead>
            <TableHead>Verified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
            </TableRow>
          )}
          {data?.rows.map((s: any) => {
            const stale =
              !s.lastVerifiedAt ||
              Date.now() - new Date(s.lastVerifiedAt).getTime() > 30 * 86400000;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <button onClick={() => setEdit(s)} className="font-medium hover:underline">
                    {s.name}
                  </button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.operator.name}</TableCell>
                <TableCell className="text-xs">{s.microMarket}, {s.city}</TableCell>
                <TableCell className="text-xs">{titleCase(s.workspaceType)}</TableCell>
                <TableCell className="text-right">
                  <span className={s.availableSeats === 0 ? "text-destructive" : ""}>
                    {s.availableSeats}
                  </span>{" "}
                  / {s.totalSeats}
                </TableCell>
                <TableCell className="text-right">{formatINR(s.pricePerSeat)}</TableCell>
                <TableCell>
                  {stale ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="size-3" /> {timeAgo(s.lastVerifiedAt)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <ShieldCheck className="size-3" /> {timeAgo(s.lastVerifiedAt)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Edit space" className="max-w-2xl">
        {edit && <SpaceForm initial={edit} onDone={() => setEdit(null)} />}
      </Dialog>
    </Card>
  );
}

function AvailabilityTab() {
  const { data } = useSpaces({ pageSize: "500" });
  const grid = useMemo(() => {
    const map = new Map<string, { avail: number; total: number; spaces: number }>();
    for (const s of data?.rows ?? []) {
      const key = `${s.city}||${s.microMarket}`;
      const row = map.get(key) ?? { avail: 0, total: 0, spaces: 0 };
      row.avail += s.availableSeats;
      row.total += s.totalSeats;
      row.spaces += 1;
      map.set(key, row);
    }
    return Array.from(map.entries())
      .map(([k, v]) => {
        const [city, micro] = k.split("||");
        return { city, micro, ...v };
      })
      .sort((a, b) => b.avail - a.avail);
  }, [data]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((g) => (
            <div key={`${g.city}-${g.micro}`} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{g.micro}</p>
              <p className="text-xs text-muted-foreground">{g.city} · {g.spaces} spaces</p>
              <p className="mt-2 text-2xl font-semibold">
                {g.avail}
                <span className="text-sm font-normal text-muted-foreground"> / {g.total} seats</span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${g.total ? (g.avail / g.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {grid.length === 0 && (
            <p className="text-sm text-muted-foreground">No spaces yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
