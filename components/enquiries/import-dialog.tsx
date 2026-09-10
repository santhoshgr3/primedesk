"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/hooks/use-crm";

export function ImportDialog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFile(f: File) {
    setCsv(await f.text());
  }

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.jsonFetch<any>("/api/enquiries/import", {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      setResult(res);
      qc.invalidateQueries({ queryKey: ["enquiries"] });
      toast({
        title: `Imported ${res.created} enquiries`,
        description:
          res.skipped || res.errors.length
            ? `${res.skipped} duplicates skipped, ${res.errors.length} errors`
            : undefined,
        variant: "success",
      });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" /> Import CSV
      </Button>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setResult(null);
        }}
        title="Import enquiries from CSV"
        description="Paste CSV or choose a file. Rows with an existing phone number are skipped."
        className="max-w-xl"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              Choose file
            </Button>
            <a
              href="/api/enquiries/import/template"
              className="text-xs text-primary hover:underline"
            >
              Download template
            </a>
          </div>

          <Textarea
            rows={8}
            placeholder="companyName,contactName,phone,email,seats,city,type,source&#10;Acme,Riya,+9190...,,50-100,Hyderabad,MANAGED_OFFICE,REFERRAL"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="font-mono text-xs"
          />

          {result && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                <strong>{result.created}</strong> created ·{" "}
                <strong>{result.skipped}</strong> skipped (dupes) ·{" "}
                <strong>{result.errors.length}</strong> errors
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto text-xs text-destructive">
                  {result.errors.slice(0, 20).map((e: any, i: number) => (
                    <li key={i}>
                      Row {e.row}: {e.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={run} disabled={busy || !csv.trim()}>
              {busy ? "Importing…" : "Import"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
