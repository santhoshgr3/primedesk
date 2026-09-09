"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";

const BAND: Record<string, { label: string; cls: string; bar: string }> = {
  hot: { label: "Hot", cls: "text-red-600", bar: "bg-red-500" },
  warm: { label: "Warm", cls: "text-amber-600", bar: "bg-amber-500" },
  cold: { label: "Cold", cls: "text-sky-600", bar: "bg-sky-500" },
};

export function LeadScore({
  enquiryId,
  score,
  priority,
  scoredAt,
}: {
  enquiryId: string;
  score: number | null;
  priority: string;
  scoredAt: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState<{ score: number | null; priority: string; breakdown?: any[] }>({
    score,
    priority,
  });

  async function rescore() {
    setBusy(true);
    try {
      const res = await api.jsonFetch<{ score: number; priority: string; breakdown: any[] }>(
        `/api/enquiries/${enquiryId}/rescore`,
        { method: "POST" },
      );
      setS(res);
      toast({
        title: `Score ${res.score} · ${BAND[res.priority]?.label}`,
        variant: "success",
      });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const band = BAND[s.priority] ?? BAND.warm;
  const val = s.score ?? 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-semibold ${band.cls}`}>
          {s.score ?? "—"}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </span>
        <button
          onClick={rescore}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${busy ? "animate-spin" : ""}`} /> Rescore
        </button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${band.bar}`} style={{ width: `${val}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {band.label} lead
        {scoredAt ? ` · scored ${new Date(scoredAt).toLocaleDateString("en-IN")}` : ""}
      </p>
      {s.breakdown && s.breakdown.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
          {s.breakdown.map((b: any, i: number) => (
            <li key={i} className="flex justify-between">
              <span>{b.label}</span>
              <span className={b.points < 0 ? "text-red-500" : ""}>
                {b.points > 0 ? "+" : ""}
                {b.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
