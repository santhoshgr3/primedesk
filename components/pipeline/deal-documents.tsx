"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";
import { timeAgo, titleCase } from "@/lib/utils";

const TYPES = [
  { v: "loi", l: "LOI" },
  { v: "lease_agreement", l: "Lease agreement" },
  { v: "company_kyc", l: "Company KYC" },
  { v: "brochure", l: "Brochure" },
  { v: "other", l: "Other" },
];

export function DealDocuments({ dealId }: { dealId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("loi");
  const [busy, setBusy] = useState(false);

  const { data: docs } = useQuery({
    queryKey: ["deal-docs", dealId],
    queryFn: () => api.jsonFetch<any[]>(`/api/deals/${dealId}/documents`),
  });

  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    try {
      const res = await fetch(`/api/deals/${dealId}/documents`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      qc.invalidateQueries({ queryKey: ["deal-docs", dealId] });
      toast({ title: "Uploaded", variant: "success" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["deal-docs", dealId] });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Documents</p>
      <div className="space-y-1">
        {(docs ?? []).map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-2 rounded-md border p-2 text-sm"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate text-primary hover:underline"
            >
              {d.name}
            </a>
            <span className="shrink-0 text-xs text-muted-foreground">
              {titleCase(d.type)} · {timeAgo(d.createdAt)}
            </span>
            <button
              onClick={() => remove(d.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {docs?.length === 0 && (
          <p className="text-xs text-muted-foreground">No documents yet.</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-40">
          {TYPES.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </Select>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Upload className="size-4" /> {busy ? "Uploading…" : "Upload"}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Max 10 MB per file.</p>
    </div>
  );
}
