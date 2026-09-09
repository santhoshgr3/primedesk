"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  X,
  Trophy,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { api, useMatchedSpaces } from "@/hooks/use-crm";
import { formatINR, titleCase } from "@/lib/utils";

type Selected = { spaceId: string; advisorNote: string };

function Builder() {
  const router = useRouter();
  const { toast } = useToast();
  const sp = useSearchParams();
  const enquiryId = sp.get("enquiryId") ?? "";

  const { data: enquiry } = useQuery({
    enabled: !!enquiryId,
    queryKey: ["enquiry", enquiryId],
    queryFn: () => api.jsonFetch<any>(`/api/enquiries/${enquiryId}`),
  });
  const { data: matches, isLoading } = useMatchedSpaces(enquiryId);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Selected[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedIds = new Set(selected.map((s) => s.spaceId));
  const filtered = useMemo(
    () =>
      (matches ?? []).filter(
        (m: any) =>
          !selectedIds.has(m.id) &&
          m.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [matches, q, selectedIds],
  );
  const spaceById = useMemo(
    () => new Map((matches ?? []).map((m: any) => [m.id, m])),
    [matches],
  );

  function add(id: string) {
    if (selected.length >= 6) {
      toast({ title: "Max 6 spaces per shortlist", variant: "error" });
      return;
    }
    setSelected((s) => [...s, { spaceId: id, advisorNote: "" }]);
  }
  const remove = (id: string) =>
    setSelected((s) => s.filter((x) => x.spaceId !== id));
  function move(i: number, dir: -1 | 1) {
    setSelected((s) => {
      const next = [...s];
      const j = i + dir;
      if (j < 0 || j >= next.length) return s;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function createShortlist() {
    setBusy(true);
    try {
      const res = await api.jsonFetch<any>("/api/shortlists", {
        method: "POST",
        body: JSON.stringify({
          enquiryId,
          items: selected.map((s, i) => ({
            spaceId: s.spaceId,
            advisorNote: s.advisorNote,
            rank: i + 1,
          })),
        }),
      });
      setCreatedId(res.id);
      toast({ title: "Shortlist created", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function send(via: ("whatsapp" | "email")[]) {
    if (!createdId) return;
    setBusy(true);
    try {
      await api.jsonFetch(`/api/shortlists/${createdId}/send`, {
        method: "POST",
        body: JSON.stringify({ via }),
      });
      toast({ title: `Sent via ${via.join(" + ")}`, variant: "success" });
      router.push(`/shortlists/${createdId}`);
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!enquiryId) {
    return (
      <p className="text-sm text-muted-foreground">
        Open an enquiry and click “Build Shortlist” to start.
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Shortlist Builder"
        description={
          enquiry
            ? `${enquiry.companyName} · ${enquiry.seatsNeeded} seats · ${enquiry.city}${
                enquiry.microMarket ? ` · ${enquiry.microMarket}` : ""
              } · ${titleCase(enquiry.workspaceType)}${
                enquiry.budgetPerSeat ? ` · ₹${enquiry.budgetPerSeat}/seat budget` : ""
              }`
            : "Loading enquiry…"
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Matched */}
        <Card>
          <div className="border-b p-3">
            <Input
              placeholder="Filter matched spaces…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {isLoading
                ? "Matching…"
                : `${filtered.length} matched spaces (ranked by fit)`}
            </p>
          </div>
          <CardContent className="max-h-[560px] space-y-2 overflow-y-auto p-3">
            {filtered.map((m: any) => (
              <button
                key={m.id}
                onClick={() => add(m.id)}
                className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{m.name}</p>
                    <Badge
                      className={
                        m.matchScore >= 75
                          ? "bg-green-100 text-green-700"
                          : m.matchScore >= 55
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }
                    >
                      {m.matchScore}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.operator.name} · {m.microMarket} · {m.availableSeats} seats ·{" "}
                    {formatINR(m.pricePerSeat)}/seat
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {m.matchReasons.slice(0, 3).join(" · ")}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {!isLoading && filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No more matches. Widen the requirement or add inventory.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Selected */}
        <Card>
          <div className="border-b p-3">
            <p className="text-sm font-medium">Selected ({selected.length}/6)</p>
          </div>
          <CardContent className="space-y-3 p-3">
            {selected.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Click spaces on the left to add them.
              </p>
            )}
            {selected.map((s, i) => {
              const m: any = spaceById.get(s.spaceId);
              if (!m) return null;
              return (
                <div key={s.spaceId} className="rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.operator.name} · {formatINR(m.pricePerSeat)}/seat
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => move(i, -1)} className="rounded p-1 hover:bg-accent">
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button onClick={() => move(i, 1)} className="rounded p-1 hover:bg-accent">
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button onClick={() => remove(s.spaceId)} className="rounded p-1 hover:bg-accent">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    className="mt-2"
                    rows={2}
                    placeholder="Note for the client about this space…"
                    value={s.advisorNote}
                    onChange={(e) =>
                      setSelected((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, advisorNote: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
              );
            })}

            {selected.length > 0 && !createdId && (
              <Button className="w-full" onClick={createShortlist} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Create shortlist"}
              </Button>
            )}

            {createdId && (
              <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-green-800">
                  <Trophy className="size-4" /> Shortlist created
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/shortlists/${createdId}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    Preview PDF
                  </a>
                  <Button size="sm" onClick={() => send(["whatsapp"])} disabled={busy}>
                    Send WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => send(["email"])} disabled={busy}>
                    Send Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => send(["whatsapp", "email"])} disabled={busy}>
                    Both
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewShortlistPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Builder />
    </Suspense>
  );
}
